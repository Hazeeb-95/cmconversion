import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../../config/database';
import { Contact } from '../models/contact.entity';

const router = Router();
const contactRepo = () => AppDataSource.getRepository(Contact);

// Contact form (public)
router.post('/contacts/', async (req: Request, res: Response) => {
  const { name, organization, city, phone, email, organizationType, description } = req.body;
  const contact = contactRepo().create({
    name,
    organization: organization ?? null,
    city: city ?? null,
    phone,
    email,
    organizationType: organizationType ?? null,
    description: description ?? null,
  });
  const saved = await contactRepo().save(contact);
  res.status(201).json(saved);
});

router.get('/contacts/', async (_req: Request, res: Response) => {
  const contacts = await contactRepo().find({ order: { createdAt: 'DESC' } });
  res.json({ count: contacts.length, results: contacts });
});

// Webinar signup (public) — reuses Contact model, description field holds interest
router.post('/webinars/', async (req: Request, res: Response) => {
  const { email, description } = req.body;
  // Minimal contact entry for webinar signups
  const contact = contactRepo().create({
    name: 'Webinar Signup',
    phone: '+10000000000',
    email,
    description: description ?? null,
    organizationType: 'WEBINAR',
  });
  const saved = await contactRepo().save(contact);
  res.status(201).json(saved);
});

export default router;
