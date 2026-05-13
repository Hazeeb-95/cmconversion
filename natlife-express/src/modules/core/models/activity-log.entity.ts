import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../accounts/models/user.entity';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor!: User | null;

  @Column({ type: 'int', name: 'actor_id', nullable: true })
  actorId!: number | null;

  @Column()
  action!: string;

  @Column({ name: 'object_type' })
  objectType!: string;

  @Column({ type: 'int', name: 'object_id', nullable: true })
  objectId!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
