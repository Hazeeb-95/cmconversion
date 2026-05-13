import { Router, Request, Response } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { requireRoles } from '../../../middleware/permissions';
import { RoleName, DocumentType } from '../../../shared/constants';
import { SHGService } from '../services/shg.service';
import { AuthenticatedRequest } from '../../../shared/types';
import { documentUpload } from '../../../config/s3';
import { getMediaUrl } from '../../../shared/storage';
import { AppError } from '../../../middleware/error-handler';

const router = Router();
const shgService = new SHGService();

// List SHG profiles (SUPER_ADMIN only)
router.get(
  '/app/cm-ccm/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN),
  async (_req: Request, res: Response) => {
    const user = (_req as AuthenticatedRequest).user;
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
    const shg = await shgService.createSHG(user.id, req.body);
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

// Update SHG profile
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
      throw new AppError(400, 'Invalid or missing documentType.');
    }
    if (!shgId) throw new AppError(400, 'shgId is required.');

    const file = req.file as Express.MulterS3.File;
    const fileKey = file.key || (file as Express.Multer.File & { filename: string }).filename;
    const fileUrl = file.location || getMediaUrl(fileKey);

    const doc = await shgService.uploadDocument(
      parseInt(shgId, 10),
      documentType as DocumentType,
      fileKey,
      fileUrl,
      req.file.size,
    );
    res.status(201).json(doc);
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

// Bank details
router.get(
  '/app/cm-ccm/:shgId/bank-details/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.FINANCIER, RoleName.CM, RoleName.CCM),
  async (req: Request, res: Response) => {
    const shgId = parseInt(req.params.shgId, 10);
    const bank = await shgService.getBankDetails(shgId);
    res.json(bank ?? {});
  },
);

router.put(
  '/app/cm-ccm/:shgId/bank-details/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.CM, RoleName.CCM),
  async (req: Request, res: Response) => {
    const shgId = parseInt(req.params.shgId, 10);
    const bank = await shgService.upsertBankDetails(shgId, req.body);
    res.json(bank);
  },
);

// SHG-specific constants
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
