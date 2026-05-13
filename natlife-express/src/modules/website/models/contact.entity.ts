import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  organization!: string | null;

  @Column({ type: 'varchar', nullable: true })
  city!: string | null;

  @Column()
  phone!: string;

  @Column()
  email!: string;

  @Column({ type: 'varchar', name: 'organization_type', nullable: true })
  organizationType!: string | null;

  @Column({ nullable: true, type: 'text' })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
