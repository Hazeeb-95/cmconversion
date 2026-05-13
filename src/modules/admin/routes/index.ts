import { Router, Request, Response } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { requireRoles } from '../../../middleware/permissions';
import { RoleName } from '../../../shared/constants';
import { AppDataSource } from '../../../config/database';
import { User } from '../../accounts/models/user.entity';
import { Application } from '../../applications/models/application.entity';
import { SHG } from '../../shg/models/shg.entity';

const router = Router();

router.get(
  '/dashboard/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN),
  async (req: Request, res: Response) => {
    const userRepo = AppDataSource.getRepository(User);
    const appRepo = AppDataSource.getRepository(Application);
    const shgRepo = AppDataSource.getRepository(SHG);

    const [totalUsers, totalApplications, totalPartners] = await Promise.all([
      userRepo.count(),
      appRepo.count(),
      shgRepo.count(),
    ]);

    // Applications by status
    const appsByStatus = await appRepo
      .createQueryBuilder('app')
      .select('app.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('app.status')
      .getRawMany();

    // Users by role
    const usersByRole = await AppDataSource.getRepository('user_roles')
      .createQueryBuilder('ur')
      .leftJoin('roles', 'r', 'r.id = ur.role_id')
      .select('r.name', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.name')
      .getRawMany();

    res.json({
      totalUsers,
      totalApplications,
      totalPartners,
      applicationsByStatus: appsByStatus,
      usersByRole,
    });
  },
);

export default router;
