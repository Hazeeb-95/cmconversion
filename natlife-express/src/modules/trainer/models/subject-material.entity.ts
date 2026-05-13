import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Subject } from './subject.entity';
import { MaterialDocumentType } from '../../../shared/constants';

@Entity('subject_materials')
export class SubjectMaterial {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject!: Subject;

  @Column({ name: 'subject_id' })
  subjectId!: number;

  @Column()
  title!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string | null;

  @Column({ type: 'enum', enum: MaterialDocumentType })
  type!: MaterialDocumentType;

  @Column({ type: 'varchar', nullable: true })
  url!: string | null;

  @Column({ type: 'varchar', name: 'file_key', nullable: true })
  fileKey!: string | null;

  @Column({ type: 'varchar', name: 'file_url', nullable: true })
  fileUrl!: string | null;

  @Column({ type: 'int', name: 'file_size', nullable: true })

  fileSize!: number | null;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt!: Date;
}
