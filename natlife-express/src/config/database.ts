import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

import { User } from '../modules/accounts/models/user.entity';
import { Role } from '../modules/accounts/models/role.entity';
import { Region } from '../modules/accounts/models/region.entity';
import { Pincode } from '../modules/accounts/models/pincode.entity';
import { ActivityLog } from '../modules/core/models/activity-log.entity';
import { SHG } from '../modules/shg/models/shg.entity';
import { Document } from '../modules/shg/models/document.entity';
import { BankDetails } from '../modules/shg/models/bank-details.entity';
import { TrainerProfile } from '../modules/trainer/models/profile.entity';
import { Course } from '../modules/trainer/models/course.entity';
import { Subject } from '../modules/trainer/models/subject.entity';
import { SubjectMaterial } from '../modules/trainer/models/subject-material.entity';
import { CourseEnrollment } from '../modules/trainer/models/course-enrollment.entity';
import { CourseCompletion } from '../modules/trainer/models/course-completion.entity';
import { MaterialCompletion } from '../modules/trainer/models/material-completion.entity';
import { Group } from '../modules/trainer/models/group.entity';
import { Application } from '../modules/applications/models/application.entity';
import { Contact } from '../modules/website/models/contact.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
      ? { rejectUnauthorized: false }
      : false,
  entities: [
    User,
    Role,
    Region,
    Pincode,
    ActivityLog,
    SHG,
    Document,
    BankDetails,
    TrainerProfile,
    Course,
    Subject,
    SubjectMaterial,
    CourseEnrollment,
    CourseCompletion,
    MaterialCompletion,
    Group,
    Application,
    Contact,
  ],
  migrations: ['dist/migrations/*.js'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
});

export async function initializeDatabase(): Promise<void> {
  await AppDataSource.initialize();
}
