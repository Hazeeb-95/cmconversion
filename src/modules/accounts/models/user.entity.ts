import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinTable,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Role } from './role.entity';
import { Region } from './region.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  @Index()
  phone!: string;

  @Column({ unique: true, nullable: true })
  @Index()
  email!: string | null;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'is_staff', default: false })
  isStaff!: boolean;

  @Column({ name: 'is_approved', default: false })
  isApproved!: boolean;

  @Column({ name: 'invite_accepted', default: false })
  inviteAccepted!: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified!: boolean;

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'role_id' },
  })
  roles!: Role[];

  @ManyToOne(() => Region, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'region_id' })
  region!: Region | null;

  @Column({ type: 'int', name: 'region_id', nullable: true })
  regionId!: number | null;

  @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'manager_id' })
  manager!: User | null;

  @Column({ type: 'int', name: 'manager_id', nullable: true })
  managerId!: number | null;

  @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User | null;

  @Column({ type: 'int', name: 'created_by_id', nullable: true })
  createdById!: number | null;

  @Column({ name: 'email_confirmation_token', nullable: true })
  emailConfirmationToken!: string | null;

  @Column({ name: 'email_confirmation_sent_at', type: 'timestamptz', nullable: true })
  emailConfirmationSentAt!: Date | null;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken!: string | null;

  @Column({ name: 'totp_secret', nullable: true })
  totpSecret!: string | null;

  @Column({ name: 'recovery_codes', type: 'jsonb', nullable: true })
  recoveryCodes!: string[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  get roleNames(): string[] {
    return this.roles?.map((r) => r.name) ?? [];
  }

  hasRole(roleName: string): boolean {
    return this.roleNames.includes(roleName);
  }
}
