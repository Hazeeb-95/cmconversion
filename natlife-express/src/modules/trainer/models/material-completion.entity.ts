import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Column,
} from 'typeorm';
import { User } from '../../accounts/models/user.entity';
import { SubjectMaterial } from './subject-material.entity';

@Entity('material_completions')
@Unique(['userId', 'materialId'])
export class MaterialCompletion {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne(() => SubjectMaterial, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material!: SubjectMaterial;

  @Column({ name: 'material_id' })
  materialId!: number;

  @CreateDateColumn({ name: 'completed_at', type: 'timestamptz' })
  completedAt!: Date;
}
