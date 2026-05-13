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

  @Column({ type: 'varchar', name: 'file_key' })
  fileKey!: string;

  @Column({ type: 'varchar', name: 'file_url' })
  fileUrl!: string;

  @Column({ type: 'int', name: 'file_size', nullable: true })
  fileSize!: number | null;

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.PENDING })
  status!: DocumentStatus;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt!: Date;
}
