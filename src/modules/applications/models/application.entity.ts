import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../accounts/models/user.entity';
import {
  ApplicationStatus,
  PaymentType,
  PaymentMethod,
  PaymentClearance,
} from '../../../shared/constants';

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.SUBMITTED,
  })
  status!: ApplicationStatus;

  @Column({ name: 'reference_number', unique: true, nullable: true })
  referenceNumber!: string | null;

  @Column({
    type: 'enum',
    enum: PaymentType,
    name: 'payment_type',
    nullable: true,
  })
  paymentType!: PaymentType | null;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
    nullable: true,
  })
  paymentMethod!: PaymentMethod | null;

  @Column({
    type: 'enum',
    enum: PaymentClearance,
    name: 'payment_status',
    default: PaymentClearance.PENDING,
  })
  paymentStatus!: PaymentClearance;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_financier_id' })
  assignedFinancier!: User | null;

  @Column({ type: 'int', name: 'assigned_financier_id', nullable: true })
  assignedFinancierId!: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_trainer_id' })
  assignedTrainer!: User | null;

  @Column({ type: 'int', name: 'assigned_trainer_id', nullable: true })
  assignedTrainerId!: number | null;

  @Column({ name: 'public_notes', nullable: true, type: 'text' })
  publicNotes!: string | null;

  @Column({ name: 'private_notes', nullable: true, type: 'text' })
  privateNotes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
