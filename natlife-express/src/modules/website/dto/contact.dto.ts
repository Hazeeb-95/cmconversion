import { IsEmail, IsOptional, IsString } from 'class-validator';
import { IsPhone } from '../../../shared/validators';

export class CreateContactDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  organization?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsPhone()
  phone!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  organizationType?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

// Webinar signup — only email + optional description
export class CreateWebinarDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
