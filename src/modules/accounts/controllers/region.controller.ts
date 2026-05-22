import { Request, Response } from 'express';
import { RegionService } from '../services/region.service';

const regionService = new RegionService();

export async function listRegionsHandler(_req: Request, res: Response): Promise<void> {
  const regions = await regionService.listRegions();
  res.json({ count: regions.length, results: regions });
}

export async function getRegionHandler(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  const region = await regionService.getRegionWithPincodes(id);
  res.json(region);
}

export async function createRegionHandler(req: Request, res: Response): Promise<void> {
  const region = await regionService.createRegion(req.body);
  res.status(201).json(region);
}

export async function updateRegionHandler(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  const region = await regionService.updateRegion(id, req.body);
  res.json(region);
}

export async function deleteRegionHandler(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  await regionService.deleteRegion(id);
  res.status(204).send();
}
