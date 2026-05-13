import { AppDataSource } from '../../../config/database';
import { SHG } from '../models/shg.entity';
import { Document } from '../models/document.entity';
import { BankDetails } from '../models/bank-details.entity';
import { User } from '../../accounts/models/user.entity';
import { AppError } from '../../../middleware/error-handler';
import { RoleName, DocumentType, DocumentStatus, MAX_FILE_SIZES } from '../../../shared/constants';
import { validateAge } from '../../../shared/validators';
import { deleteFileFromS3 } from '../../../shared/storage';
import type { CreateSHGDto, UpdateSHGDto, CreateBankDetailsDto, UpdateBankDetailsDto } from '../dto/shg.dto';

export class SHGService {
  private shgRepo = AppDataSource.getRepository(SHG);
  private documentRepo = AppDataSource.getRepository(Document);
  private bankRepo = AppDataSource.getRepository(BankDetails);

  async listSHG(requestingUser: User): Promise<SHG[]> {
    if (!requestingUser.hasRole(RoleName.SUPER_ADMIN)) {
      throw new AppError(403, 'Only SUPER_ADMIN can list all SHG profiles.');
    }
    return this.shgRepo.find({ relations: ['user'] });
  }

  async getSHGById(id: number, requestingUser: User): Promise<SHG & { documents: Document[]; bankDetails: BankDetails | null }> {
    const shg = await this.shgRepo.findOne({ where: { id }, relations: ['user'] });
    if (!shg) throw new AppError(404, 'SHG profile not found.');

    // Permission: SUPER_ADMIN, ADMIN, FINANCIER can see all; CM/CCM can see only own
    const roles = requestingUser.roleNames;
    const canViewAll = [RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.FINANCIER].some((r) =>
      roles.includes(r),
    );
    const isOwner = shg.userId === requestingUser.id;

    if (!canViewAll && !isOwner) {
      throw new AppError(403, 'You do not have permission to view this profile.');
    }

    const documents = await this.documentRepo.find({ where: { shgId: id } });
    const bankDetails = await this.bankRepo.findOne({ where: { shgId: id } });

    return { ...shg, documents, bankDetails };
  }

  async getSHGByUserId(userId: number): Promise<SHG | null> {
    return this.shgRepo.findOne({ where: { userId }, relations: ['user'] });
  }

  async createSHG(userId: number, dto: CreateSHGDto): Promise<SHG> {
    const existing = await this.shgRepo.findOne({ where: { userId } });
    if (existing) throw new AppError(409, 'SHG profile already exists for this user.');

    if (dto.dob) {
      const dobDate = new Date(dto.dob);
      const ageCheck = validateAge(dobDate);
      if (!ageCheck.valid) throw new AppError(400, ageCheck.message!);
    }

    const shg = this.shgRepo.create({
      userId,
      dob: dto.dob ? new Date(dto.dob) : null,
      gender: dto.gender ?? null,
      maritalStatus: dto.maritalStatus ?? null,
      bloodGroup: dto.bloodGroup ?? null,
      language: dto.language ?? null,
      addressLine1: dto.addressLine1 ?? null,
      addressLine2: dto.addressLine2 ?? null,
      district: dto.district ?? null,
      village: dto.village ?? null,
      state: dto.state ?? null,
      country: dto.country ?? null,
      pincode: dto.pincode ?? null,
      isSubmitted: dto.isSubmitted ?? false,
    });

    return this.shgRepo.save(shg);
  }

  async updateSHG(id: number, dto: UpdateSHGDto, requestingUser: User): Promise<SHG> {
    const shg = await this.shgRepo.findOne({ where: { id } });
    if (!shg) throw new AppError(404, 'SHG profile not found.');

    const roles = requestingUser.roleNames;
    const canEdit = [RoleName.SUPER_ADMIN, RoleName.ADMIN].some((r) => roles.includes(r));
    const isOwner = shg.userId === requestingUser.id;

    if (!canEdit && !isOwner) {
      throw new AppError(403, 'You do not have permission to update this profile.');
    }

    if (dto.dob) {
      const dobDate = new Date(dto.dob);
      const ageCheck = validateAge(dobDate);
      if (!ageCheck.valid) throw new AppError(400, ageCheck.message!);
      shg.dob = dobDate;
    }

    if (dto.gender !== undefined) shg.gender = dto.gender!;
    if (dto.maritalStatus !== undefined) shg.maritalStatus = dto.maritalStatus!;
    if (dto.bloodGroup !== undefined) shg.bloodGroup = dto.bloodGroup!;
    if (dto.language !== undefined) shg.language = dto.language!;
    if (dto.addressLine1 !== undefined) shg.addressLine1 = dto.addressLine1!;
    if (dto.addressLine2 !== undefined) shg.addressLine2 = dto.addressLine2!;
    if (dto.district !== undefined) shg.district = dto.district!;
    if (dto.village !== undefined) shg.village = dto.village!;
    if (dto.state !== undefined) shg.state = dto.state!;
    if (dto.country !== undefined) shg.country = dto.country!;
    if (dto.pincode !== undefined) shg.pincode = dto.pincode!;
    if (dto.isSubmitted !== undefined) shg.isSubmitted = dto.isSubmitted!;

    return this.shgRepo.save(shg);
  }

  async uploadDocument(
    shgId: number,
    documentType: DocumentType,
    fileKey: string,
    fileUrl: string,
    fileSize: number,
  ): Promise<Document> {
    if (fileSize > MAX_FILE_SIZES.DOCUMENT) {
      throw new AppError(400, 'File size exceeds 5MB limit.');
    }

    const doc = this.documentRepo.create({
      shgId,
      documentType,
      fileKey,
      fileUrl,
      fileSize,
      status: DocumentStatus.PENDING,
    });

    return this.documentRepo.save(doc);
  }

  async deleteDocument(docId: number, requestingUser: User): Promise<void> {
    const doc = await this.documentRepo.findOne({
      where: { id: docId },
      relations: ['shg'],
    });
    if (!doc) throw new AppError(404, 'Document not found.');

    const shg = await this.shgRepo.findOne({ where: { id: doc.shgId } });
    if (!shg) throw new AppError(404, 'SHG not found.');

    const roles = requestingUser.roleNames;
    const canDelete = [RoleName.SUPER_ADMIN, RoleName.ADMIN].some((r) => roles.includes(r));
    const isOwner = shg.userId === requestingUser.id;

    if (!canDelete && !isOwner) {
      throw new AppError(403, 'You do not have permission to delete this document.');
    }

    if (doc.fileKey) {
      try {
        await deleteFileFromS3(doc.fileKey);
      } catch {
        // best-effort cleanup
      }
    }

    await this.documentRepo.remove(doc);
  }

  async upsertBankDetails(shgId: number, dto: CreateBankDetailsDto | UpdateBankDetailsDto): Promise<BankDetails> {
    let bank = await this.bankRepo.findOne({ where: { shgId } });
    if (!bank) {
      bank = this.bankRepo.create({ shgId });
    }

    Object.assign(bank, dto);
    return this.bankRepo.save(bank);
  }

  async getBankDetails(shgId: number): Promise<BankDetails | null> {
    return this.bankRepo.findOne({ where: { shgId } });
  }
}
