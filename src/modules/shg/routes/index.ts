import { Router, Request, Response } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { requireRoles } from '../../../middleware/permissions';
import { RoleName, DocumentType, DocumentStatus } from '../../../shared/constants';
import { SHGService } from '../services/shg.service';
import { AuthenticatedRequest } from '../../../shared/types';
import { documentUpload } from '../../../config/s3';
import { getMediaUrl } from '../../../shared/storage';
import { AppError } from '../../../middleware/error-handler';

const router = Router();
const shgService = new SHGService();

// ── SHG Profiles ────────────────────────────────────────────────────────────

// List all SHG profiles (SUPER_ADMIN only)
router.get(
  '/app/cm-ccm/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const profiles = await shgService.listSHG(user);
    res.json({ count: profiles.length, results: profiles });
  },
);

// Create SHG profile
router.post(
  '/app/cm-ccm/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.CM, RoleName.CCM),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const shg = await shgService.createSHG(user, req.body);
    res.status(201).json(shg);
  },
);

// Get SHG profile by ID
router.get(
  '/app/cm-ccm/:id/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.FINANCIER, RoleName.CM, RoleName.CCM),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const id = parseInt(req.params.id, 10);
    const profile = await shgService.getSHGById(id, user);
    res.json(profile);
  },
);

// Update SHG profile (partial)
router.patch(
  '/app/cm-ccm/:id/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.CM, RoleName.CCM),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const id = parseInt(req.params.id, 10);
    const shg = await shgService.updateSHG(id, req.body, user);
    res.json(shg);
  },
);

// ── Documents ────────────────────────────────────────────────────────────────

// List documents for a SHG profile
router.get(
  '/app/documents/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.FINANCIER, RoleName.CM, RoleName.CCM),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const shgId = parseInt(req.query.shgId as string, 10);
    if (!shgId) throw new AppError(400, 'shgId query parameter is required.');
    const docs = await shgService.listDocuments(shgId, user);
    res.json({ count: docs.length, results: docs });
  },
);

// Upload document
router.post(
  '/app/documents/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.CM, RoleName.CCM),
  documentUpload.single('file'),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const { documentType, shgId } = req.body;

    if (!req.file) throw new AppError(400, 'No file provided.');
    if (!documentType || !Object.values(DocumentType).includes(documentType)) {
      throw new AppError(400, `Invalid or missing documentType. Valid values: ${Object.values(DocumentType).join(', ')}`);
    }
    if (!shgId) throw new AppError(400, 'shgId is required.');

    const file = req.file as Express.MulterS3.File;
    const fileKey = (file as any).key || (file as any).filename;
    const fileUrl = (file as any).location || getMediaUrl(fileKey);
    const originalName = req.file.originalname;

    const doc = await shgService.uploadDocument(
      parseInt(shgId, 10),
      documentType as DocumentType,
      fileKey,
      fileUrl,
      req.file.size,
      originalName,
      user,
    );
    res.status(201).json(doc);
  },
);

// Update document status (ADMIN/SUPER_ADMIN only)
router.patch(
  '/app/documents/:id/status/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const docId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!status || !Object.values(DocumentStatus).includes(status)) {
      throw new AppError(400, `Invalid status. Valid values: ${Object.values(DocumentStatus).join(', ')}`);
    }

    const doc = await shgService.updateDocumentStatus(docId, status as DocumentStatus, user);
    res.json(doc);
  },
);

// Delete document
router.delete(
  '/app/documents/:id/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.CM, RoleName.CCM),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    await shgService.deleteDocument(parseInt(req.params.id, 10), user);
    res.status(204).send();
  },
);

// ── Bank Details ─────────────────────────────────────────────────────────────

// Get bank details for a SHG
router.get(
  '/app/cm-ccm/:shgId/bank-details/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.FINANCIER, RoleName.CM, RoleName.CCM),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const shgId = parseInt(req.params.shgId, 10);
    const bank = await shgService.getBankDetails(shgId, user);
    res.json(bank ?? {});
  },
);

// Create or update bank details
router.put(
  '/app/cm-ccm/:shgId/bank-details/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.CM, RoleName.CCM),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const shgId = parseInt(req.params.shgId, 10);
    const bank = await shgService.upsertBankDetails(shgId, req.body, user);
    res.json(bank);
  },
);

// ── Constants ────────────────────────────────────────────────────────────────

// Enum constants for frontend dropdowns
router.get('/constants/', (_req: Request, res: Response) => {
  const { Gender, MaritalStatus, BloodGroup, DocumentType, DocumentStatus, RegistrationStatus } =
    require('../../../shared/constants');
  res.json({
    gender: Object.values(Gender),
    maritalStatus: Object.values(MaritalStatus),
    bloodGroup: Object.values(BloodGroup),
    documentType: Object.values(DocumentType),
    documentStatus: Object.values(DocumentStatus),
    registrationStatus: Object.values(RegistrationStatus),
  });
});

export default router;
