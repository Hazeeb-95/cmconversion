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

  @Column({ name: 'course_id' })
  courseId!: number;

  @Column()
  name!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string | null;

  @Column({ name: 'img_key', nullable: true })
  imgKey!: string | null;

  @Column({ name: 'img_url', nullable: true })
  imgUrl!: string | null;
}
