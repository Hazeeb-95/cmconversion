export enum RoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TRAINER = 'TRAINER',
  FINANCIER = 'FINANCIER',
  CM = 'CM',
  CCM = 'CCM',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
}

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export enum DocumentType {
  AADHAR_FRONT = 'AADHAR_FRONT',
  AADHAR_BACK = 'AADHAR_BACK',
  PAN = 'PAN',
  CERTIFICATES = 'CERTIFICATES',
  EXPERIENCE = 'EXPERIENCE',
  BANK_DOC = 'BANK_DOC',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REUPLOADED = 'REUPLOADED',
}

export enum RegistrationStatus {
  REGISTERED = 'REGISTERED',
  UNREGISTERED = 'UNREGISTERED',
  IN_PROCESS = 'IN_PROCESS',
}

export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ASSIGNED = 'ASSIGNED',
  TRAINING = 'TRAINING',
  PRODUCTION = 'PRODUCTION',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  REJECTED = 'REJECTED',
}

export enum PaymentType {
  INSTALLMENTS = 'INSTALLMENTS',
  FULL_PAYMENT = 'FULL_PAYMENT',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ONLINE_PAYMENT = 'ONLINE_PAYMENT',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CARD = 'CARD',
}

export enum PaymentClearance {
  PENDING = 'PENDING',
  CLEARED = 'CLEARED',
}

export enum MaterialDocumentType {
  SYLLABUS = 'SYLLABUS',
  LECTURE_NOTES = 'LECTURE_NOTES',
  ASSIGNMENT = 'ASSIGNMENT',
  REFERENCE_MATERIAL = 'REFERENCE_MATERIAL',
  OTHER = 'OTHER',
}

// Valid status transitions
export const APPLICATION_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.SUBMITTED]: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.REJECTED],
  [ApplicationStatus.UNDER_REVIEW]: [ApplicationStatus.ASSIGNED, ApplicationStatus.REJECTED],
  [ApplicationStatus.ASSIGNED]: [ApplicationStatus.TRAINING],
  [ApplicationStatus.TRAINING]: [ApplicationStatus.PRODUCTION],
  [ApplicationStatus.PRODUCTION]: [],
  [ApplicationStatus.ACTION_REQUIRED]: [ApplicationStatus.UNDER_REVIEW],
  [ApplicationStatus.REJECTED]: [],
};

export const MAX_FILE_SIZES = {
  IMAGE: 3 * 1024 * 1024,       // 3MB
  DOCUMENT: 5 * 1024 * 1024,    // 5MB
  MATERIAL: 30 * 1024 * 1024,   // 30MB
};

export const OTP_TTL_SECONDS = 300;       // 5 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LENGTH = 6;

export const JWT_ACCESS_EXPIRY = '4h';
export const JWT_REFRESH_EXPIRY = '7d';

export const REFERENCE_NUMBER_PREFIX = 'CM';
