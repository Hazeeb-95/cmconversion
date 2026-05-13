import { Request } from 'express';
import { User } from '../modules/accounts/models/user.entity';

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface PaginatedResponse<T> {
  count: number;
  results: T[];
}

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface JwtPayload {
  sub: number;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface FirebaseDecodedToken {
  uid: string;
  email?: string;
  phone_number?: string;
  name?: string;
}

export interface OtpCacheEntry {
  code: string;
  attempts: number;
  createdAt: number;
}

export interface StorageFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  location?: string;   // S3 URL
  key?: string;        // S3 key
  path?: string;       // Local path
}

export type FilterOperator = 'exact' | 'icontains' | 'in' | 'isnull';

export interface QueryFilter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}
