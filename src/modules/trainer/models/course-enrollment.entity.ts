import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Column,
} from 'typeorm';
import { User } from '../../accounts/models/user.entity';
import { Course } from './course.entity';

@Entity('course_enrollments')
@Unique(['userId', 'courseId'])
export class CourseEnrollment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @Column({ name: 'course_id' })
  courseId!: number;

  @CreateDateColumn({ name: 'enrollment_date', type: 'timestamptz' })
  enrollmentDate!: Date;
}
