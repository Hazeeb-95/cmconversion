import { In } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { TrainerProfile } from '../models/profile.entity';
import { Course } from '../models/course.entity';
import { Subject } from '../models/subject.entity';
import { SubjectMaterial } from '../models/subject-material.entity';
import { CourseEnrollment } from '../models/course-enrollment.entity';
import { CourseCompletion } from '../models/course-completion.entity';
import { MaterialCompletion } from '../models/material-completion.entity';
import { Group } from '../models/group.entity';
import { User } from '../../accounts/models/user.entity';
import { AppError } from '../../../middleware/error-handler';
import { RoleName, MAX_FILE_SIZES } from '../../../shared/constants';
import { deleteFileFromS3 } from '../../../shared/storage';
import type {
  CreateProfileDto,
  UpdateProfileDto,
  CreateCourseDto,
  UpdateCourseDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  CreateSubjectMaterialDto,
  UpdateSubjectMaterialDto,
  CreateCourseEnrollmentDto,
  CreateCourseCompletionDto,
  CreateMaterialCompletionDto,
  CreateGroupDto,
  GroupEnrollmentDto,
} from '../dto/trainer.dto';

export class TrainerService {
  private profileRepo = AppDataSource.getRepository(TrainerProfile);
  private courseRepo = AppDataSource.getRepository(Course);
  private subjectRepo = AppDataSource.getRepository(Subject);
  private materialRepo = AppDataSource.getRepository(SubjectMaterial);
  private enrollmentRepo = AppDataSource.getRepository(CourseEnrollment);
  private completionRepo = AppDataSource.getRepository(CourseCompletion);
  private materialCompRepo = AppDataSource.getRepository(MaterialCompletion);
  private groupRepo = AppDataSource.getRepository(Group);
  private userRepo = AppDataSource.getRepository(User);

  // ── Profiles ───────────────────────────────────────────────────────────────

  async listProfiles(): Promise<TrainerProfile[]> {
    return this.profileRepo.find({ relations: ['user'] });
  }

  async getProfile(id: number): Promise<TrainerProfile> {
    const profile = await this.profileRepo.findOne({ where: { id }, relations: ['user'] });
    if (!profile) throw new AppError(404, 'Trainer profile not found.');
    return profile;
  }

  async upsertProfile(userId: number, dto: CreateProfileDto | UpdateProfileDto): Promise<TrainerProfile> {
    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepo.create({ userId });
    }
    Object.assign(profile, dto);
    return this.profileRepo.save(profile);
  }

  // ── Courses ────────────────────────────────────────────────────────────────

  async listCourses(requestingUser: User): Promise<Course[]> {
    const qb = this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.createdBy', 'creator');

    if (requestingUser.hasRole(RoleName.TRAINER)) {
      qb.where('course.created_by_id = :uid', { uid: requestingUser.id });
    }

    return qb.getMany();
  }

  async getCourse(id: number): Promise<Course & { subjects: Subject[] }> {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new AppError(404, 'Course not found.');
    const subjects = await this.subjectRepo.find({ where: { courseId: id } });
    return { ...course, subjects };
  }

  async createCourse(dto: CreateCourseDto, createdBy: User): Promise<Course> {
    const course = this.courseRepo.create({ ...dto, createdById: createdBy.id });
    return this.courseRepo.save(course);
  }

  async updateCourse(id: number, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new AppError(404, 'Course not found.');
    Object.assign(course, dto);
    return this.courseRepo.save(course);
  }

  async uploadCourseImage(courseId: number, fileKey: string, fileUrl: string, fileSize: number): Promise<Course> {
    if (fileSize > MAX_FILE_SIZES.IMAGE) throw new AppError(400, 'Image exceeds 3MB limit.');
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new AppError(404, 'Course not found.');
    if (course.imgKey) await deleteFileFromS3(course.imgKey).catch(() => null);
    course.imgKey = fileKey;
    course.imgUrl = fileUrl;
    return this.courseRepo.save(course);
  }

  // ── Subjects ───────────────────────────────────────────────────────────────

  async listSubjects(courseId?: number): Promise<Subject[]> {
    return courseId
      ? this.subjectRepo.find({ where: { courseId } })
      : this.subjectRepo.find();
  }

  async getSubject(id: number): Promise<Subject & { materials: SubjectMaterial[] }> {
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (!subject) throw new AppError(404, 'Subject not found.');
    const materials = await this.materialRepo.find({ where: { subjectId: id } });
    return { ...subject, materials };
  }

  async createSubject(dto: CreateSubjectDto): Promise<Subject> {
    const course = await this.courseRepo.findOne({ where: { id: dto.courseId } });
    if (!course) throw new AppError(404, 'Course not found.');
    return this.subjectRepo.save(this.subjectRepo.create(dto));
  }

  async updateSubject(id: number, dto: UpdateSubjectDto): Promise<Subject> {
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (!subject) throw new AppError(404, 'Subject not found.');
    Object.assign(subject, dto);
    return this.subjectRepo.save(subject);
  }

  // ── Subject Materials ──────────────────────────────────────────────────────

  async listMaterials(subjectId?: number, userId?: number): Promise<Array<SubjectMaterial & { isCompleted: boolean }>> {
    const materials = subjectId
      ? await this.materialRepo.find({ where: { subjectId } })
      : await this.materialRepo.find();

    if (!userId) return materials.map((m) => ({ ...m, isCompleted: false }));

    const completions = await this.materialCompRepo.find({ where: { userId } });
    const completedIds = new Set(completions.map((c) => c.materialId));

    return materials.map((m) => ({ ...m, isCompleted: completedIds.has(m.id) }));
  }

  async createMaterial(dto: CreateSubjectMaterialDto): Promise<SubjectMaterial> {
    const subject = await this.subjectRepo.findOne({ where: { id: dto.subjectId } });
    if (!subject) throw new AppError(404, 'Subject not found.');
    return this.materialRepo.save(this.materialRepo.create(dto));
  }

  async updateMaterial(id: number, dto: UpdateSubjectMaterialDto): Promise<SubjectMaterial> {
    const material = await this.materialRepo.findOne({ where: { id } });
    if (!material) throw new AppError(404, 'Material not found.');
    Object.assign(material, dto);
    return this.materialRepo.save(material);
  }

  async uploadMaterialFile(
    materialId: number,
    fileKey: string,
    fileUrl: string,
    fileSize: number,
  ): Promise<SubjectMaterial> {
    if (fileSize > MAX_FILE_SIZES.MATERIAL) throw new AppError(400, 'File exceeds 30MB limit.');
    const material = await this.materialRepo.findOne({ where: { id: materialId } });
    if (!material) throw new AppError(404, 'Material not found.');
    if (material.fileKey) await deleteFileFromS3(material.fileKey).catch(() => null);
    material.fileKey = fileKey;
    material.fileUrl = fileUrl;
    material.fileSize = fileSize;
    return this.materialRepo.save(material);
  }

  // ── Enrollments ────────────────────────────────────────────────────────────

  async listEnrollments(userId?: number, courseId?: number): Promise<CourseEnrollment[]> {
    const where: Partial<CourseEnrollment> = {};
    if (userId) where.userId = userId;
    if (courseId) where.courseId = courseId;
    return this.enrollmentRepo.find({ where, relations: ['user', 'course'] });
  }

  async createEnrollment(dto: CreateCourseEnrollmentDto): Promise<CourseEnrollment> {
    const user = await this.userRepo.findOne({ where: { id: dto.userId }, relations: ['roles'] });
    if (!user) throw new AppError(404, 'User not found.');
    if (!user.hasRole(RoleName.CM) && !user.hasRole(RoleName.CCM)) {
      throw new AppError(400, 'Only CM/CCM users can be enrolled in courses.');
    }

    const existing = await this.enrollmentRepo.findOne({
      where: { userId: dto.userId, courseId: dto.courseId },
    });
    if (existing) return existing; // idempotent

    return this.enrollmentRepo.save(this.enrollmentRepo.create(dto));
  }

  // ── Course Completions ─────────────────────────────────────────────────────

  async createCourseCompletion(dto: CreateCourseCompletionDto): Promise<CourseCompletion> {
    // Validate eligibility: all materials in course must be completed
    const eligible = await this.isEligibleForCompletion(dto.userId, dto.courseId);
    if (!eligible) {
      throw new AppError(400, 'User has not completed all materials in this course.');
    }

    const existing = await this.completionRepo.findOne({
      where: { userId: dto.userId, courseId: dto.courseId },
    });
    if (existing) return existing;

    return this.completionRepo.save(this.completionRepo.create(dto));
  }

  async isEligibleForCompletion(userId: number, courseId: number): Promise<boolean> {
    // Get all materials for course (via subjects)
    const subjects = await this.subjectRepo.find({ where: { courseId } });
    if (!subjects.length) return false;

    const subjectIds = subjects.map((s) => s.id);
    const materials = await this.materialRepo.find({ where: { subjectId: In(subjectIds) } });
    if (!materials.length) return false;

    const materialIds = materials.map((m) => m.id);
    const completions = await this.materialCompRepo.find({
      where: { userId, materialId: In(materialIds) },
    });

    return completions.length === materialIds.length;
  }

  // ── Material Completions ───────────────────────────────────────────────────

  async createMaterialCompletion(dto: CreateMaterialCompletionDto): Promise<MaterialCompletion> {
    const existing = await this.materialCompRepo.findOne({
      where: { userId: dto.userId, materialId: dto.materialId },
    });
    if (existing) return existing;
    return this.materialCompRepo.save(this.materialCompRepo.create(dto));
  }

  async listMaterialCompletions(userId?: number): Promise<MaterialCompletion[]> {
    return userId
      ? this.materialCompRepo.find({ where: { userId } })
      : this.materialCompRepo.find();
  }

  // ── Groups ─────────────────────────────────────────────────────────────────

  async listGroups(requestingUser: User): Promise<Group[]> {
    const qb = this.groupRepo
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.course', 'course')
      .leftJoinAndSelect('group.createdBy', 'creator')
      .leftJoinAndSelect('group.users', 'users');

    if (requestingUser.hasRole(RoleName.TRAINER)) {
      qb.where('group.created_by_id = :uid', { uid: requestingUser.id });
    }

    return qb.getMany();
  }

  async createGroup(dto: CreateGroupDto, createdBy: User): Promise<Group> {
    const group = this.groupRepo.create({
      name: dto.name,
      courseId: dto.courseId ?? null,
      createdById: createdBy.id,
    });

    if (dto.userIds?.length) {
      group.users = await this.userRepo.findBy({ id: In(dto.userIds) });
    } else {
      group.users = [];
    }

    return this.groupRepo.save(group);
  }

  async enrollGroupInCourse(dto: GroupEnrollmentDto): Promise<{ enrolled: number; skipped: number }> {
    const group = await this.groupRepo.findOne({
      where: { id: dto.groupId },
      relations: ['users', 'users.roles'],
    });
    if (!group) throw new AppError(404, 'Group not found.');

    let enrolled = 0;
    let skipped = 0;

    for (const user of group.users) {
      if (!user.hasRole(RoleName.CM) && !user.hasRole(RoleName.CCM)) {
        skipped++;
        continue;
      }
      try {
        await this.createEnrollment({ userId: user.id, courseId: dto.courseId });
        enrolled++;
      } catch {
        skipped++;
      }
    }

    return { enrolled, skipped };
  }
}
