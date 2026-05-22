import { AppDataSource } from '../../../config/database';
import { Region } from '../models/region.entity';
import { Pincode } from '../models/pincode.entity';
import { AppError } from '../../../middleware/error-handler';
import type { CreateRegionDto, UpdateRegionDto } from '../dto/user.dto';

export class RegionService {
  private regionRepo = AppDataSource.getRepository(Region);
  private pincodeRepo = AppDataSource.getRepository(Pincode);

  async listRegions(): Promise<Region[]> {
    return this.regionRepo.find();
  }

  async getRegion(id: number): Promise<Region> {
    const region = await this.regionRepo.findOne({ where: { id } });
    if (!region) throw new AppError(404, 'Region not found.');
    return region;
  }

  async getRegionWithPincodes(id: number): Promise<Region & { pincodes: Pincode[] }> {
    const region = await this.getRegion(id);
    const pincodes = await this.pincodeRepo.find({ where: { regionId: id } });
    return { ...region, pincodes };
  }

  async createRegion(dto: CreateRegionDto): Promise<Region> {
    const existing = await this.regionRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new AppError(409, 'Region with this name already exists.');

    const region = await this.regionRepo.save(this.regionRepo.create({ name: dto.name }));

    if (dto.pincodes?.length) {
      await this.syncPincodes(region.id, dto.pincodes);
    }

    return region;
  }

  async updateRegion(id: number, dto: UpdateRegionDto): Promise<Region> {
    const region = await this.getRegion(id);
    if (dto.name !== undefined) region.name = dto.name;
    await this.regionRepo.save(region);

    if (dto.pincodes !== undefined) {
      await this.syncPincodes(id, dto.pincodes);
    }

    return this.getRegion(id);
  }

  private async syncPincodes(regionId: number, codes: string[]): Promise<void> {
    await this.pincodeRepo.delete({ regionId });
    const entities = codes.map((code) =>
      this.pincodeRepo.create({ code, regionId }),
    );
    await this.pincodeRepo.save(entities);
  }

  async deleteRegion(id: number): Promise<void> {
    const region = await this.getRegion(id);
    await this.regionRepo.remove(region);
  }

  async listPincodes(regionId: number): Promise<Pincode[]> {
    return this.pincodeRepo.find({ where: { regionId } });
  }
}
