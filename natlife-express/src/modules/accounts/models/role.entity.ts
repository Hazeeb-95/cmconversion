import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { RoleName } from '../../../shared/constants';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: RoleName, unique: true })
  name!: RoleName;
}
