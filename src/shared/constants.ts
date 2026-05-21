export enum RoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TRAINER = 'TRAINER',
  FINANCIER = 'FINANCIER',
  CM = 'CM',
  CCM = 'CCM',
}

// Match Django's exact lowercase values
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
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

// Full document types including all education certificates
export enum DocumentType {
  AADHAR_FRONT = 'aadhar_front',
  AADHAR_BACK = 'aadhar_back',
  PAN = 'pan',
  TENTH_CERTIFICATE = 'tenth_certificate',
  TWELFTH_CERTIFICATE = 'twelfth_certificate',
  DIPLOMA = 'diploma',
  BACHELOR_DEGREE = 'bachelor_certificate',
  MASTERS_DEGREE = 'master_certificate',
  PHD_DEGREE = 'phd_certificate',
  EXPERIENCE_CERTIFICATE = 'experience_certificate',
  BANK_DOC = 'bank_doc',
  OTHER = 'other',
}

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REUPLOADED = 'reuploaded',
}

export enum RegistrationStatus {
  REGISTERED = 'registered',
  UNREGISTERED = 'unregistered',
  IN_PROCESS = 'in_process',
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
  IMAGE: 3 * 1024 * 1024,
  DOCUMENT: 5 * 1024 * 1024,
  MATERIAL: 30 * 1024 * 1024,
};

export const OTP_TTL_SECONDS = 300;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LENGTH = 6;

export const JWT_ACCESS_EXPIRY = '4h';
export const JWT_REFRESH_EXPIRY = '7d';

export const REFERENCE_NUMBER_PREFIX = 'CM';
