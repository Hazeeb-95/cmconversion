import { sendEmail } from '../../../config/email';
import {
  RoleName,
  Gender,
  MaritalStatus,
  BloodGroup,
  DocumentType,
  DocumentStatus,
  RegistrationStatus,
  ApplicationStatus,
  PaymentType,
  PaymentMethod,
  PaymentClearance,
  MaterialDocumentType,
} from '../../../shared/constants';

export class CoreService {
  getConstants(): Record<string, unknown> {
    return {
      roles: Object.values(RoleName).map((v) => ({ value: v, label: v })),
      gender: Object.values(Gender).map((v) => ({ value: v, label: v })),
      maritalStatus: Object.values(MaritalStatus).map((v) => ({ value: v, label: v })),
      bloodGroup: Object.values(BloodGroup).map((v) => ({ value: v, label: v })),
      documentType: Object.values(DocumentType).map((v) => ({ value: v, label: v })),
      documentStatus: Object.values(DocumentStatus).map((v) => ({ value: v, label: v })),
      registrationStatus: Object.values(RegistrationStatus).map((v) => ({ value: v, label: v })),
      applicationStatus: Object.values(ApplicationStatus).map((v) => ({ value: v, label: v })),
      paymentType: Object.values(PaymentType).map((v) => ({ value: v, label: v })),
      paymentMethod: Object.values(PaymentMethod).map((v) => ({ value: v, label: v })),
      paymentClearance: Object.values(PaymentClearance).map((v) => ({ value: v, label: v })),
      materialDocumentType: Object.values(MaterialDocumentType).map((v) => ({ value: v, label: v })),
    };
  }

  async sendHtmlMail(to: string, subject: string, html: string): Promise<void> {
    await sendEmail({ to, subject, html });
  }

  currentYear(): number {
    return new Date().getFullYear();
  }
}
