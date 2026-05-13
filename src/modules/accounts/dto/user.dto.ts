import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsEnum,
  IsInt,
  MinLength,
} from 'class-validator';
import { RoleName } from '../../../shared/constants';
import { IsPhone } from '../../../shared/validators';

export class CreateUserDto {
  @IsPhone()
  phone!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @IsArray()
  @IsEnum(RoleName, { each: true })
  @IsOptional()
  roles?: RoleName[];

  @IsInt()
  @IsOptional()
  regionId?: number;

  @IsInt()
  @IsOptional()
  managerId?: number;
}

export class UpdateUserDto {
  @IsPhone()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsArray()
  @IsEnum(RoleName, { each: true })
  @IsOptional()
  roles?: RoleName[];

  @IsInt()
  @IsOptional()
  regionId?: number;

  @IsInt()
  @IsOptional()
  managerId?: number;
}

export class SendInviteDto {
  @IsArray()
  users!: InviteUserDto[];
}

export class InviteUserDto {
  @IsPhone()
  phone!: string;

  @IsEmail()
  email!: string;

  @IsEnum(RoleName)
  role!: RoleName;

  @IsInt()
  @IsOptional()
  regionId?: number;

  @IsInt()
  @IsOptional()
  managerId?: number;
}

export class ResendInviteDto {
  @IsEmail()
  email!: string;
}

export class AcceptInviteDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class FirebaseLoginDto {
  @IsString()
  idToken!: string;
}

export class CreateRegionDto {
  @IsString()
  name!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  pincodes?: string[];
}

export class UpdateRegionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  pincodes?: string[];
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

export class PhoneOtpRequestDto {
  @IsPhone()
  phone!: string;
}

export class PhoneOtpVerifyDto {
  @IsPhone()
  phone!: string;

  @IsString()
  code!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
