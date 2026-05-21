import { AppDataSource } from '../../../config/database';
import { SHG } from '../models/shg.entity';
import { Document } from '../models/document.entity';
import { BankDetails } from '../models/bank-details.entity';
import { User } from '../../accounts/models/user.entity';
import { Pincode } from '../../accounts/models/pincode.entity';
import { Region } from '../../accounts/models/region.entity';
import { AppError } from '../../../middleware/error-handler';
import { RoleName, DocumentType, DocumentStatus, MAX_FILE_SIZES } from '../../../shared/constants';
import { validateAge } from '../../../shared/validators';
import { deleteFileFromS3 } from '../../../shared/storage';
import type { CreateSHGDto, UpdateSHGDto, CreateBankDetailsDto } from '../dto/shg.dto';

export class SHGService {
  private shgRepo = AppDataSource.getRepository(SHG);
  private documentRepo = AppDataSource.getRepository(Document);
  private bankRepo = AppDataSource.getRepository(BankDetails);
  private userRepo = AppDataSource.getRepository(User);
  private pincodeRepo = AppDataSource.getRepository(Pincode);
  private regionRepo = AppDataSource.getRepository(Region);

  // ── List ───────────────────────────────────────────────────────────────────

  async listSHG(requestingUser: User): Promise<SHG[]> {
    if (!requestingUser.hasRole(RoleName.SUPER_ADMIN)) {
      throw new AppError(403, 'Only SUPER_ADMIN can list all SHG profiles.');
    }
    return this.shgRepo.find({ relations: ['user'] });
  }

  // ── Get by ID ──────────────────────────────────────────────────────────────

  async getSHGById(id: number, requestingUser: User): Promise<SHG & { documents: Document[]; bankDetails: BankDetails | null }> {
    const shg = await this.shgRepo.findOne({ where: { id }, relations: ['user'] });
    if (!shg) throw new AppError(404, 'SHG profile not found.');

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

  // ── Create ─────────────────────────────────────────────────────────────────

  async createSHG(requestingUser: User, dto: CreateSHGDto): Promise<SHG> {
    // Only CM/CCM can create their own profile
    if (!requestingUser.hasRole(RoleName.CM) && !requestingUser.hasRole(RoleName.CCM) &&
        !requestingUser.hasRole(RoleName.SUPER_ADMIN) && !requestingUser.hasRole(RoleName.ADMIN)) {
      throw new AppError(403, 'Only CM/CCM users can register as Partner.');
    }

    const targetUserId = dto.userId ?? requestingUser.id;

    const existing = await this.shgRepo.findOne({ where: { userId: targetUserId } });
    if (existing) throw new AppError(409, 'SHG profile already exists for this user.');

    if (dto.dob) {
      const ageCheck = validateAge(new Date(dto.dob));
      if (!ageCheck.valid) throw new AppError(400, ageCheck.message!);
    }

    const shg = this.shgRepo.create({
      userId: targetUserId,
      dob: dto.dob ? new Date(dto.dob) : null,
      gender: dto.gender ?? undefined,
      maritalStatus: dto.maritalStatus ?? undefined,
      bloodGroup: dto.bloodGroup ?? null,
      language: dto.language ?? null,
      addressLine1: dto.addressLine1 ?? null,
      addressLine2: dto.addressLine2 ?? null,
      district: dto.district ?? null,
      village: dto.village ?? null,
      state: dto.state ?? null,
      country: dto.country ?? 'IN',
      pincode: dto.pincode ?? null,
      isSubmitted: false,
    });

    const saved = await this.shgRepo.save(shg);

    // Auto-assign region from pincode
    if (dto.pincode) {
      await this.assignRegionByPincode(targetUserId, dto.pincode);
    }

    return saved;
  }

  // ── Update ─────────────────────────────────────────────────────────────────

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
      const ageCheck = validateAge(new Date(dto.dob));
      if (!ageCheck.valid) throw new AppError(400, ageCheck.message!);
      shg.dob = new Date(dto.dob);
    }
    if (dto.gender !== undefined) shg.gender = dto.gender!;
    if (dto.maritalStatus !== undefined) shg.maritalStatus = dto.maritalStatus!;
    if (dto.bloodGroup !== undefined) shg.bloodGroup = dto.bloodGroup!;
    if (dto.language !== undefined) shg.language = dto.language;
    if (dto.addressLine1 !== undefined) shg.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) shg.addressLine2 = dto.addressLine2;
    if (dto.district !== undefined) shg.district = dto.district;
    if (dto.village !== undefined) shg.village = dto.village;
    if (dto.state !== undefined) shg.state = dto.state;
    if (dto.country !== undefined) shg.country = dto.country;
    if (dto.isSubmitted !== undefined) shg.isSubmitted = dto.isSubmitted;

    // Pincode update — auto-assign region
    if (dto.pincode !== undefined && dto.pincode !== shg.pincode) {
      shg.pincode = dto.pincode;
      if (dto.pincode) {
        await this.assignRegionByPincode(shg.userId, dto.pincode);
      }
    }

    return this.shgRepo.save(shg);
  }

  // ── Pincode → Region assignment (mirrors Django serializer logic) ──────────

  private async assignRegionByPincode(userId: number, pincode: string): Promise<void> {
    const pincodeObj = await this.pincodeRepo.findOne({
      where: { code: pincode },
      relations: ['region'],
    });
    if (!pincodeObj) return;

    const region = pincodeObj.region;
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    user.regionId = region.id;

    // Assign region admin as manager
    if (region.adminId) {
      user.managerId = region.adminId;
    }

    await this.userRepo.save(user);
  }

  // ── Documents ──────────────────────────────────────────────────────────────

  async uploadDocument(
    shgId: number,
    documentType: DocumentType,
    fileKey: string,
    fileUrl: string,
    fileSize: number,
    originalName: string,
    requestingUser: User,
  ): Promise<Document> {
    const shg = await this.shgRepo.findOne({ where: { id: shgId } });
    if (!shg) throw new AppError(404, 'SHG profile not found.');

    const roles = requestingUser.roleNames;
    const canUpload = [RoleName.SUPER_ADMIN, RoleName.ADMIN].some((r) => roles.includes(r));
    const isOwner = shg.userId === requestingUser.id;

    if (!canUpload && !isOwner) {
      throw new AppError(403, 'You do not have permission to upload documents for this profile.');
    }

    if (fileSize > MAX_FILE_SIZES.DOCUMENT) {
      throw new AppError(400, 'File size exceeds 5MB limit.');
    }

    const doc = this.documentRepo.create({
      shgId,
      documentType,
      fileKey,
      fileUrl,
      fileSize,
      originalName,
      status: DocumentStatus.PENDING,
    });

    return this.documentRepo.save(doc);
  }

  async listDocuments(shgId: number, requestingUser: User): Promise<Document[]> {
    const shg = await this.shgRepo.findOne({ where: { id: shgId } });
    if (!shg) throw new AppError(404, 'SHG profile not found.');

    const roles = requestingUser.roleNames;
    const canView = [RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.FINANCIER].some((r) =>
      roles.includes(r),
    );
    const isOwner = shg.userId === requestingUser.id;

    if (!canView && !isOwner) {
      throw new AppError(403, 'You do not have permission to view these documents.');
    }

    return this.documentRepo.find({ where: { shgId } });
  }

  async updateDocumentStatus(
    docId: number,
    status: DocumentStatus,
    requestingUser: User,
  ): Promise<Document> {
    const doc = await this.documentRepo.findOne({ where: { id: docId } });
    if (!doc) throw new AppError(404, 'Document not found.');

    const canUpdate = [RoleName.SUPER_ADMIN, RoleName.ADMIN].some((r) =>
      requestingUser.roleNames.includes(r),
    );
    if (!canUpdate) throw new AppError(403, 'Only ADMIN can update document status.');

    doc.status = status;
    return this.documentRepo.save(doc);
  }

  async deleteDocument(docId: number, requestingUser: User): Promise<void> {
    const doc = await this.documentRepo.findOne({ where: { id: docId } });
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
      try { await deleteFileFromS3(doc.fileKey); } catch { /* best-effort */ }
    }

    await this.documentRepo.remove(doc);
  }

  // ── Bank Details ───────────────────────────────────────────────────────────

  async upsertBankDetails(shgId: number, dto: CreateBankDetailsDto, requestingUser: User): Promise<BankDetails> {
    const shg = await this.shgRepo.findOne({ where: { id: shgId } });
    if (!shg) throw new AppError(404, 'SHG profile not found.');

    const canEdit = [RoleName.SUPER_ADMIN, RoleName.ADMIN].some((r) =>
      requestingUser.roleNames.includes(r),
    );
    const isOwner = shg.userId === requestingUser.id;
    if (!canEdit && !isOwner) throw new AppError(403, 'Permission denied.');

    let bank = await this.bankRepo.findOne({ where: { shgId } });
    if (!bank) bank = this.bankRepo.create({ shgId });

    Object.assign(bank, dto);
    return this.bankRepo.save(bank);
  }

  async getBankDetails(shgId: number, requestingUser: User): Promise<BankDetails | null> {
    const shg = await this.shgRepo.findOne({ where: { id: shgId } });
    if (!shg) throw new AppError(404, 'SHG profile not found.');

    const canView = [RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.FINANCIER].some((r) =>
      requestingUser.roleNames.includes(r),
    );
    const isOwner = shg.userId === requestingUser.id;
    if (!canView && !isOwner) throw new AppError(403, 'Permission denied.');

    return this.bankRepo.findOne({ where: { shgId } });
  }
}
