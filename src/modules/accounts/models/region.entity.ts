import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

@Entity('regions')
export class Region {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  // admin relation wired after User entity to avoid circular import
  @Column({ type: 'int', nullable: true, name: 'admin_id' })
  adminId!: number | null;

  // pincodes is resolved via Pincode.region
}
