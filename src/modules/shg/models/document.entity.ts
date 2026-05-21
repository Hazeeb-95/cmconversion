import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SHG } from './shg.entity';
import { DocumentType, DocumentStatus } from '../../../shared/constants';

@Entity('shg_documents')
export class Document {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => SHG, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shg_id' })
  shg!: SHG;

  @Column({ type: 'int', name: 'shg_id' })
  shgId!: number;

  @Column({ type: 'enum', enum: DocumentType, name: 'document_type' })
  documentType!: DocumentType;

  // S3 key (production) or local path (development)
  @Column({ type: 'varchar', length: 500, name: 'file_key' })
  fileKey!: string;

  // Public accessible URL
  @Column({ type: 'varchar', length: 1000, name: 'file_url' })
  fileUrl!: string;

  @Column({ type: 'int', name: 'file_size', nullable: true })
  fileSize!: number | null;

  @Column({ type: 'varchar', name: 'original_name', nullable: true })
  originalName!: string | null;

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.PENDING })
  status!: DocumentStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'uploaded_at' })
  uploadedAt!: Date;
}
