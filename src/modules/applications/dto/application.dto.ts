import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus, PaymentType, PaymentMethod, PaymentClearance } from '../../../shared/constants';

export class CreateApplicationDto {
  @IsInt()
  userId!: number;

  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  publicNotes?: string;

  @IsString()
  @IsOptional()
  privateNotes?: string;
}

export class UpdateApplicationDto {
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsEnum(PaymentClearance)
  @IsOptional()
  paymentStatus?: PaymentClearance;

  @IsInt()
  @IsOptional()
  assignedFinancierId?: number;

  @IsInt()
  @IsOptional()
  assignedTrainerId?: number;

  @IsString()
  @IsOptional()
  publicNotes?: string;

  @IsString()
  @IsOptional()
  privateNotes?: string;
}
