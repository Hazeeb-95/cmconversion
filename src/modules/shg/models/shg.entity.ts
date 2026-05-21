import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../accounts/models/user.entity';
import { Gender, MaritalStatus, BloodGroup, RegistrationStatus } from '../../../shared/constants';

@Entity('shg_profiles')
export class SHG {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'int', name: 'user_id' })
  userId!: number;

  // ── Personal Info ──────────────────────────────────────────────────────────

  @Column({ type: 'date', nullable: true })
  dob!: Date | null;

  @Column({ type: 'enum', enum: Gender, default: Gender.MALE })
  gender!: Gender;

  @Column({ type: 'enum', enum: MaritalStatus, name: 'marital_status', default: MaritalStatus.SINGLE })
  maritalStatus!: MaritalStatus;

  @Column({ type: 'enum', enum: BloodGroup, name: 'blood_group', nullable: true })
  bloodGroup!: BloodGroup | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  language!: string | null;

  // ── Address Info ───────────────────────────────────────────────────────────

  @Column({ type: 'varchar', length: 255, name: 'address_line_1', nullable: true })
  addressLine1!: string | null;

  @Column({ type: 'varchar', length: 255, name: 'address_line_2', nullable: true, default: '' })
  addressLine2!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  village!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, default: 'IN' })
  country!: string | null;

  @Column({ type: 'varchar', length: 6, nullable: true })
  pincode!: string | null;

  // ── Status ─────────────────────────────────────────────────────────────────

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    name: 'registration_status',
    default: RegistrationStatus.UNREGISTERED,
  })
  registrationStatus!: RegistrationStatus;

  @Column({ type: 'boolean', name: 'is_submitted', default: false })
  isSubmitted!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
