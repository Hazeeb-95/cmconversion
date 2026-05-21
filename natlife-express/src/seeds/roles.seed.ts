import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../config/database';
import { Role } from '../modules/accounts/models/role.entity';
import { RoleName } from '../shared/constants';

async function seedRoles(): Promise<void> {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Role);

  for (const name of Object.values(RoleName)) {
    const exists = await repo.findOne({ where: { name } });
    if (!exists) {
      await repo.save(repo.create({ name }));
      console.log(`Seeded role: ${name}`);
    } else {
      console.log(`Already exists: ${name}`);
    }
  }

  await AppDataSource.destroy();
  console.log('Done.');
}

seedRoles().catch((err) => {
  console.error(err);
  process.exit(1);
});
