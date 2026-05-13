import { AppDataSource } from '../../../config/database';
import { ActivityLog } from '../models/activity-log.entity';
import { User } from '../../accounts/models/user.entity';

export class ActivityService {
  private logRepo = AppDataSource.getRepository(ActivityLog);

  async log(
    actor: User | null,
    action: string,
    objectType: string,
    objectId?: number,
    metadata?: Record<string, unknown>,
  ): Promise<ActivityLog> {
    const entry = this.logRepo.create({
      actorId: actor?.id ?? null,
      action,
      objectType,
      objectId: objectId ?? null,
      metadata: metadata ?? null,
    });
    return this.logRepo.save(entry);
  }

  async getLogs(
    objectType?: string,
    objectId?: number,
    actorId?: number,
  ): Promise<ActivityLog[]> {
    const qb = this.logRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.actor', 'actor')
      .orderBy('log.created_at', 'DESC');

    if (objectType) qb.andWhere('log.object_type = :objectType', { objectType });
    if (objectId) qb.andWhere('log.object_id = :objectId', { objectId });
    if (actorId) qb.andWhere('log.actor_id = :actorId', { actorId });

    return qb.getMany();
  }
}
