import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { Gender, MaritalStatus, BloodGroup } from '../../../shared/constants';
import { IsIfsc } from '../../../shared/validators';

export class CreateSHGDto {
  // Allow ADMIN/SUPER_ADMIN to create a profile on behalf of another user
  @IsInt()
  @IsOptional()
  userId?: number;

  @IsDateString()
  @IsOptional()
  dob?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsEnum(MaritalStatus)
  @IsOptional()
  maritalStatus?: MaritalStatus;

  @IsEnum(BloodGroup)
  @IsOptional()
  bloodGroup?: BloodGroup;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  addressLine1?: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  village?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  pincode?: string;

  @IsBoolean()
  @IsOptional()
  isSubmitted?: boolean;
}

export class UpdateSHGDto extends CreateSHGDto {}

export class CreateBankDetailsDto {
  @IsString()
  accountHolderName!: string;

  @IsString()
  accountNumber!: string;

  @IsString()
  bankName!: string;

  @IsString()
  branchName!: string;

  @IsIfsc()
  ifscCode!: string;
}

export class UpdateBankDetailsDto {
  @IsString()
  @IsOptional()
  accountHolderName?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  branchName?: string;

  @IsIfsc()
  @IsOptional()
  ifscCode?: string;
}
