import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
  IsUrl,
} from 'class-validator';
import { MaterialDocumentType } from '../../../shared/constants';

export class CreateProfileDto {
  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsInt()
  @IsOptional()
  experienceYears?: number;
}

export class UpdateProfileDto extends CreateProfileDto {}

export class CreateCourseDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateSubjectDto {
  @IsInt()
  courseId!: number;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSubjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateSubjectMaterialDto {
  @IsInt()
  subjectId!: number;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(MaterialDocumentType)
  type!: MaterialDocumentType;

  @IsUrl()
  @IsOptional()
  url?: string;
}

export class UpdateSubjectMaterialDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(MaterialDocumentType)
  @IsOptional()
  type?: MaterialDocumentType;

  @IsUrl()
  @IsOptional()
  url?: string;
}

export class CreateCourseEnrollmentDto {
  @IsInt()
  userId!: number;

  @IsInt()
  courseId!: number;
}

export class CreateCourseCompletionDto {
  @IsInt()
  userId!: number;

  @IsInt()
  courseId!: number;
}

export class CreateMaterialCompletionDto {
  @IsInt()
  userId!: number;

  @IsInt()
  materialId!: number;
}

export class CreateGroupDto {
  @IsString()
  name!: string;

  @IsInt()
  @IsOptional()
  courseId?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  userIds?: number[];
}

export class GroupEnrollmentDto {
  @IsInt()
  groupId!: number;

  @IsInt()
  courseId!: number;
}
