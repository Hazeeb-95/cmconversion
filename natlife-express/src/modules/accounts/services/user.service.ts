import { In, IsNull } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { User } from '../models/user.entity';
import { Role } from '../models/role.entity';
import { Region } from '../models/region.entity';
import { Pincode } from '../models/pincode.entity';
import { AppError } from '../../../middleware/error-handler';
import { RoleName } from '../../../shared/constants';
import { AuthService } from './auth.service';
import type { CreateUserDto, UpdateUserDto, InviteUserDto } from '../dto/user.dto';

export class UserService {
  private userRepo = AppDataSource.getRepository(User);
  private roleRepo = AppDataSource.getRepository(Role);
  private regionRepo = AppDataSource.getRepository(Region);
  private pincodeRepo = AppDataSource.getRepository(Pincode);
  private authService = new AuthService();

  private async resolveRoles(roleNames: RoleName[]): Promise<Role[]> {
    return this.roleRepo.findBy({ name: In(roleNames) });
  }

  async listUsers(filters: Record<string, unknown>, requestingUser: User): Promise<User[]> {
    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('user.region', 'region');

    // Role-based filtering
    if (requestingUser.hasRole(RoleName.ADMIN)) {
      qb.andWhere('user.region_id = :regionId', { regionId: requestingUser.regionId });
    }

    // Query filters
    if (filters.roles__name__exact) {
      qb.andWhere('role.name = :roleName', { roleName: filters.roles__name__exact });
    }
    if (filters.roles__name__icontains) {
      qb.andWhere('LOWER(role.name) LIKE :roleIContains', {
        roleIContains: `%${String(filters.roles__name__icontains).toLowerCase()}%`,
      });
    }
    if (filters.region__exact) {
      qb.andWhere('user.region_id = :rid', { rid: filters.region__exact });
    }
    if (filters.region__isnull === 'true') {
      qb.andWhere('user.region_id IS NULL');
    }
    if (filters.manager__exact) {
      qb.andWhere('user.manager_id = :mid', { mid: filters.manager__exact });
    }

    return qb.getMany();
  }

  async getUser(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['roles', 'region', 'manager'],
    });
    if (!user) throw new AppError(404, 'User not found.');
    return user;
  }

  async createUser(dto: CreateUserDto, createdBy?: User): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
    if (existing) throw new AppError(409, 'User with this phone already exists.');

    const user = this.userRepo.create({
      phone: dto.phone,
      email: dto.email ?? null,
      regionId: dto.regionId ?? null,
      managerId: dto.managerId ?? null,
      createdById: createdBy?.id ?? null,
      isActive: true,
    });

    if (dto.password) {
      user.passwordHash = await this.authService.hashPassword(dto.password);
    }

    if (dto.roles?.length) {
      user.roles = await this.resolveRoles(dto.roles);
    } else {
      user.roles = [];
    }

    return this.userRepo.save(user);
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.getUser(id);

    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.regionId !== undefined) user.regionId = dto.regionId;
    if (dto.managerId !== undefined) user.managerId = dto.managerId;
    if (dto.roles !== undefined) {
      user.roles = await this.resolveRoles(dto.roles);
    }

    return this.userRepo.save(user);
  }

   async sendBatchInvites(
    invites: InviteUserDto[],
    invitedBy: User,
  ): Promise<{ created: User[]; skipped: string[] }> {
    const created: User[] = [];
    const skipped: string[] = [];

    for (const invite of invites) {
      const existing = await this.userRepo.findOne({
        where: [{ phone: invite.phone }, { email: invite.email }],
      });
      if (existing) {
        skipped.push(invite.email);
        continue;
      }

      const role = await this.roleRepo.findOne({ where: { name: invite.role } });
      if (!role) {
        skipped.push(invite.email);
        continue;
      }

      const token = this.authService.generateInviteToken();
      const user = this.userRepo.create({
        phone: invite.phone,
        email: invite.email,
        regionId: invite.regionId ?? null,
        managerId: invite.managerId ?? invitedBy.id,
        createdById: invitedBy.id,
        isActive: false,
        inviteAccepted: false,
        roles: [role],
        emailConfirmationToken: token,
        emailConfirmationSentAt: new Date(),
      });

      const saved = await this.userRepo.save(user);
      await this.authService.sendInviteEmail(saved, token);
      created.push(saved);

      // If ADMIN role and region provided, assign admin to region
      if (invite.role === RoleName.ADMIN && invite.regionId) {
        await this.regionRepo.update(invite.regionId, { adminId: saved.id });
      }
    }

    return { created, skipped };
  }


 async serializeUser(user: User): Promise<Record<string, unknown>> {
    // Gather computed fields
    const roleNames = user.roleNames;
    const hasPassword = !!user.passwordHash;

    // Lazy-load SHG id if CM/CCM
    let partnerId: number | null = null;
    let applicationId: number | null = null;

    if (roleNames.includes(RoleName.CM) || roleNames.includes(RoleName.CCM)) {
      const shgRepo = AppDataSource.getRepository('shg_profiles');
      const shg = await shgRepo.findOne({ where: { userId: user.id } } as never) as { id: number } | null;
      partnerId = shg?.id ?? null;

      const appRepo = AppDataSource.getRepository('applications');
      const app = await appRepo.findOne({ where: { userId: user.id } } as never) as { id: number; referenceNumber: string } | null;
      applicationId = app?.id ?? null;
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      isApproved: user.isApproved,
      inviteAccepted: user.inviteAccepted,
      roles: roleNames,
      regionId: user.regionId,
      regionName: user.region?.name ?? null,
      managerId: user.managerId,
      hasPassword,
      partnerId,
      applicationId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
