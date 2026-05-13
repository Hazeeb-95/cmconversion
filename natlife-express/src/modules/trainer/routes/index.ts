import { Router, Request, Response } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { requireRoles } from '../../../middleware/permissions';
import { RoleName, MaterialDocumentType } from '../../../shared/constants';
import { TrainerService } from '../services/trainer.service';
import { AuthenticatedRequest } from '../../../shared/types';
import { imageUpload, materialUpload } from '../../../config/s3';
import { getMediaUrl } from '../../../shared/storage';
import { AppError } from '../../../middleware/error-handler';

const router = Router();
const trainerService = new TrainerService();

// ── Trainer Profiles ──────────────────────────────────────────────────────
router.get('/app/profiles/', requireAuth, async (_req, res) => {
  const profiles = await trainerService.listProfiles();
  res.json({ count: profiles.length, results: profiles });
});

router.put(
  '/app/profiles/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.TRAINER),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const profile = await trainerService.upsertProfile(user.id, req.body);
    res.json(profile);
  },
);

router.get('/app/profiles/:id/', requireAuth, async (req, res) => {
  const profile = await trainerService.getProfile(parseInt(req.params.id, 10));
  res.json(profile);
});

// ── Courses ────────────────────────────────────────────────────────────────
router.get('/app/courses/', requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const courses = await trainerService.listCourses(user);
  res.json({ count: courses.length, results: courses });
});

router.post(
  '/app/courses/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.TRAINER),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const course = await trainerService.createCourse(req.body, user);
    res.status(201).json(course);
  },
);

router.get('/app/courses/:id/', requireAuth, async (req, res) => {
  const course = await trainerService.getCourse(parseInt(req.params.id, 10));
  res.json(course);
});

router.patch(
  '/app/courses/:id/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.TRAINER),
  async (req, res) => {
    const course = await trainerService.updateCourse(parseInt(req.params.id, 10), req.body);
    res.json(course);
  },
);

router.post(
  '/app/courses/:id/image/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.TRAINER),
  imageUpload.single('img'),
  async (req: Request, res: Response) => {
    if (!req.file) throw new AppError(400, 'No image provided.');
    const file = req.file as Express.MulterS3.File;
    const fileKey = file.key || (file as Express.Multer.File & { filename: string }).filename;
    const fileUrl = file.location || getMediaUrl(fileKey);
    const course = await trainerService.uploadCourseImage(
      parseInt(req.params.id, 10),
      fileKey,
      fileUrl,
      req.file.size,
    );
    res.json(course);
  },
);

// ── Subjects ───────────────────────────────────────────────────────────────
router.get('/app/subjects/', requireAuth, async (req, res) => {
  const courseId = req.query.courseId ? parseInt(req.query.courseId as string, 10) : undefined;
  const subjects = await trainerService.listSubjects(courseId);
  res.json({ count: subjects.length, results: subjects });
});

router.post(
  '/app/subjects/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.TRAINER),
  async (req, res) => {
    const subject = await trainerService.createSubject(req.body);
    res.status(201).json(subject);
  },
);

router.get('/app/subjects/:id/', requireAuth, async (req, res) => {
  const subject = await trainerService.getSubject(parseInt(req.params.id, 10));
  res.json(subject);
});

router.patch(
  '/app/subjects/:id/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.TRAINER),
  async (req, res) => {
    const subject = await trainerService.updateSubject(parseInt(req.params.id, 10), req.body);
    res.json(subject);
  },
);

// ── Subject Materials ──────────────────────────────────────────────────────
router.get('/app/subject-materials/', requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const subjectId = req.query.subjectId ? parseInt(req.query.subjectId as string, 10) : undefined;
  const materials = await trainerService.listMaterials(subjectId, user.id);
  res.json({ count: materials.length, results: materials });
});

router.post(
  '/app/subject-materials/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.TRAINER),
  async (req, res) => {
    const material = await trainerService.createMaterial(req.body);
    res.status(201).json(material);
  },
);

router.patch(
  '/app/subject-materials/:id/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.TRAINER),
  async (req, res) => {
    const material = await trainerService.updateMaterial(parseInt(req.params.id, 10), req.body);
    res.json(material);
  },
);

router.post(
  '/app/subject-materials/:id/file/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.TRAINER),
  materialUpload.single('file'),
  async (req: Request, res: Response) => {
    if (!req.file) throw new AppError(400, 'No file provided.');
    const file = req.file as Express.MulterS3.File;
    const fileKey = file.key || (file as Express.Multer.File & { filename: string }).filename;
    const fileUrl = file.location || getMediaUrl(fileKey);
    const material = await trainerService.uploadMaterialFile(
      parseInt(req.params.id, 10),
      fileKey,
      fileUrl,
      req.file.size,
    );
    res.json(material);
  },
);

// ── Enrollments ────────────────────────────────────────────────────────────
router.get('/app/course-enrollments/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;
  const courseId = req.query.courseId ? parseInt(req.query.courseId as string, 10) : undefined;
  const enrollments = await trainerService.listEnrollments(userId, courseId);
  res.json({ count: enrollments.length, results: enrollments });
});

router.post(
  '/app/course-enrollments/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.TRAINER),
  async (req, res) => {
    const enrollment = await trainerService.createEnrollment(req.body);
    res.status(201).json(enrollment);
  },
);

// ── Course Completions ─────────────────────────────────────────────────────
router.post(
  '/app/course-completions/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.TRAINER, RoleName.CM, RoleName.CCM),
  async (req, res) => {
    const completion = await trainerService.createCourseCompletion(req.body);
    res.status(201).json(completion);
  },
);

// ── Material Completions ───────────────────────────────────────────────────
router.get('/app/material-completions/', requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const completions = await trainerService.listMaterialCompletions(user.id);
  res.json({ count: completions.length, results: completions });
});

router.post(
  '/app/material-completions/',
  requireAuth,
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const body = { ...req.body, userId: user.id };
    const completion = await trainerService.createMaterialCompletion(body);
    res.status(201).json(completion);
  },
);

// ── Groups ─────────────────────────────────────────────────────────────────
router.get('/app/groups/', requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const groups = await trainerService.listGroups(user);
  res.json({ count: groups.length, results: groups });
});

router.post(
  '/app/groups/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.TRAINER),
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const group = await trainerService.createGroup(req.body, user);
    res.status(201).json(group);
  },
);

// Group enrollment (bulk enroll group in course)
router.post(
  '/app/group-enrollments/',
  requireAuth,
  requireRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.TRAINER),
  async (req, res) => {
    const result = await trainerService.enrollGroupInCourse(req.body);
    res.json(result);
  },
);

// Trainer constants
router.get('/constants/', (_req, res) => {
  res.json({
    materialDocumentType: Object.values(MaterialDocumentType),
  });
});

export default router;
