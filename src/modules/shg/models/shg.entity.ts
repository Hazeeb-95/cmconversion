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

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ type: 'date', nullable: true })
  dob!: Date | null;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender!: Gender | null;

  @Column({ type: 'enum', enum: MaritalStatus, name: 'marital_status', nullable: true })
  maritalStatus!: MaritalStatus | null;

  @Column({ type: 'enum', enum: BloodGroup, name: 'blood_group', nullable: true })
  bloodGroup!: BloodGroup | null;

  @Column({ nullable: true })
  language!: string | null;

  @Column({ name: 'address_line_1', nullable: true })
  addressLine1!: string | null;

  @Column({ name: 'address_line_2', nullable: true })
  addressLine2!: string | null;

  @Column({ nullable: true })
  district!: string | null;

  @Column({ nullable: true })
  village!: string | null;

  @Column({ nullable: true })
  state!: string | null;

  @Column({ nullable: true })
  country!: string | null;

  @Column({ nullable: true, length: 6 })
  pincode!: string | null;

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    name: 'registration_status',
    default: RegistrationStatus.UNREGISTERED,
  })
  registrationStatus!: RegistrationStatus;

  @Column({ name: 'is_submitted', default: false })
  isSubmitted!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
