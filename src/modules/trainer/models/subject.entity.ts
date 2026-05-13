import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from './course.entity';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @Column({ type: 'int', name: 'course_id' })
  courseId!: number;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', name: 'img_key', nullable: true })
  imgKey!: string | null;

  @Column({ type: 'varchar', name: 'img_url', nullable: true })
  imgUrl!: string | null;
}
