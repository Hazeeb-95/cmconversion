import { AppDataSource } from '../../../config/database';
import { Application } from '../models/application.entity';
import { User } from '../../accounts/models/user.entity';
import { ActivityService } from '../../core/services/activity.service';
import { AppError } from '../../../middleware/error-handler';
import {
  ApplicationStatus,
  APPLICATION_STATUS_TRANSITIONS,
  RoleName,
  REFERENCE_NUMBER_PREFIX,
} from '../../../shared/constants';
import type { CreateApplicationDto, UpdateApplicationDto } from '../dto/application.dto';

const activityService = new ActivityService();

export class ApplicationService {
  private appRepo = AppDataSource.getRepository(Application);
  private userRepo = AppDataSource.getRepository(User);

  async generateReferenceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `${REFERENCE_NUMBER_PREFIX}-${year}-`;
    const count = await this.appRepo
      .createQueryBuilder('app')
      .where('app.reference_number LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }

  async listApplications(requestingUser: User): Promise<Application[]> {
    const qb = this.appRepo
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.user', 'user')
      .leftJoinAndSelect('app.assignedFinancier', 'financier')
      .leftJoinAndSelect('app.assignedTrainer', 'trainer');

    const roles = requestingUser.roleNames;

    if (roles.includes(RoleName.ADMIN)) {
      // ADMIN sees applications in their region
      qb.innerJoin('user.region', 'region').where('region.id = :rid', {
        rid: requestingUser.regionId,
      });
    } else if (roles.includes(RoleName.FINANCIER)) {
      qb.where('app.assigned_financier_id = :fid', { fid: requestingUser.id });
    } else if (roles.includes(RoleName.TRAINER)) {
      qb.where('app.assigned_trainer_id = :tid', { tid: requestingUser.id });
    } else if (roles.includes(RoleName.CM) || roles.includes(RoleName.CCM)) {
      qb.where('app.user_id = :uid', { uid: requestingUser.id });
    }

    return qb.getMany();
  }

  async getApplication(id: number, requestingUser: User): Promise<Application> {
    const app = await this.appRepo.findOne({
      where: { id },
      relations: ['user', 'assignedFinancier', 'assignedTrainer'],
    });
    if (!app) throw new AppError(404, 'Application not found.');

    const roles = requestingUser.roleNames;
    const canViewAll = [RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.FINANCIER].some((r) =>
      roles.includes(r),
    );
    const isOwner = app.userId === requestingUser.id;
    const isAssigned =
      app.assignedTrainerId === requestingUser.id ||
      app.assignedFinancierId === requestingUser.id;

    if (!canViewAll && !isOwner && !isAssigned) {
      throw new AppError(403, 'You do not have permission to view this application.');
    }

    return app;
  }

  async createApplication(dto: CreateApplicationDto, createdBy: User): Promise<Application> {
    const existing = await this.appRepo.findOne({ where: { userId: dto.userId } });
    if (existing) throw new AppError(409, 'Application already exists for this user.');

    const referenceNumber = await this.generateReferenceNumber();
    const app = this.appRepo.create({
      userId: dto.userId,
      paymentType: dto.paymentType ?? null,
      paymentMethod: dto.paymentMethod ?? null,
      publicNotes: dto.publicNotes ?? null,
      privateNotes: dto.privateNotes ?? null,
      status: ApplicationStatus.SUBMITTED,
      referenceNumber,
    });

    const saved = await this.appRepo.save(app);
    await activityService.log(createdBy, 'CREATED', 'Application', saved.id, {
      referenceNumber,
      status: ApplicationStatus.SUBMITTED,
    });

    return saved;
  }

  async updateApplication(
    id: number,
    dto: UpdateApplicationDto,
    requestingUser: User,
  ): Promise<Application> {
    const app = await this.appRepo.findOne({
      where: { id },
      relations: ['user', 'assignedFinancier', 'assignedTrainer'],
    });
    if (!app) throw new AppError(404, 'Application not found.');

    const roles = requestingUser.roleNames;

    // Status transition validation
    if (dto.status !== undefined && dto.status !== app.status) {
      const allowed = APPLICATION_STATUS_TRANSITIONS[app.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new AppError(
          400,
          `Cannot transition from ${app.status} to ${dto.status}. Allowed: ${allowed.join(', ') || 'none'}`,
        );
      }

      // PRODUCTION eligibility check
      if (dto.status === ApplicationStatus.PRODUCTION) {
        const eligible = await this.isEligibleForProduction(app.userId);
        if (!eligible) {
          throw new AppError(
            400,
            'User must be enrolled in and have completed at least one matching course to move to PRODUCTION.',
          );
        }
      }

      const oldStatus = app.status;
      app.status = dto.status;
      await activityService.log(requestingUser, 'STATUS_CHANGED', 'Application', app.id, {
        from: oldStatus,
        to: dto.status,
      });
    }

    // Field updates based on role
    if (roles.includes(RoleName.ADMIN) || roles.includes(RoleName.SUPER_ADMIN)) {
      if (dto.paymentType !== undefined) app.paymentType = dto.paymentType;
      if (dto.paymentMethod !== undefined) app.paymentMethod = dto.paymentMethod;
      if (dto.assignedFinancierId !== undefined) app.assignedFinancierId = dto.assignedFinancierId;
      if (dto.assignedTrainerId !== undefined) app.assignedTrainerId = dto.assignedTrainerId;
      if (dto.privateNotes !== undefined) app.privateNotes = dto.privateNotes;
    }

    if (dto.paymentStatus !== undefined) app.paymentStatus = dto.paymentStatus;
    if (dto.publicNotes !== undefined) app.publicNotes = dto.publicNotes;

    const saved = await this.appRepo.save(app);
    await activityService.log(requestingUser, 'UPDATED', 'Application', saved.id, {
      changes: Object.keys(dto),
    });

    return saved;
  }

  private async isEligibleForProduction(userId: number): Promise<boolean> {
    const enrollmentRepo = AppDataSource.getRepository('course_enrollments');
    const completionRepo = AppDataSource.getRepository('course_completions');

    const enrollments = (await enrollmentRepo.find({ where: { userId } } as never)) as Array<{ courseId: number }>;
    if (!enrollments.length) return false;

    const completions = (await completionRepo.find({ where: { userId } } as never)) as Array<{ courseId: number }>;
    if (!completions.length) return false;

    const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
    const completedCourseIds = new Set(completions.map((c) => c.courseId));

    // At least one completed course must be in enrolled courses
    for (const cid of completedCourseIds) {
      if (enrolledCourseIds.has(cid)) return true;
    }

    return false;
  }

  async getApplicationLogs(applicationId: number) {
    return activityService.getLogs('Application', applicationId);
  }
}
