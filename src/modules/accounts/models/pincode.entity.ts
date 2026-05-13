import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Region } from './region.entity';

@Entity('pincodes')
export class Pincode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true, length: 6 })
  @Index()
  code!: string;

  @ManyToOne(() => Region, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'region_id' })
  region!: Region;

  @Column({ type: 'int', name: 'region_id' })
  regionId!: number;
}
