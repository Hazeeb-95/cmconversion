import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  organization!: string | null;

  @Column({ nullable: true })
  city!: string | null;

  @Column()
  phone!: string;

  @Column()
  email!: string;

  @Column({ name: 'organization_type', nullable: true })
  organizationType!: string | null;

  @Column({ nullable: true, type: 'text' })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
