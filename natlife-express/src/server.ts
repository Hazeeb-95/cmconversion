import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { initializeDatabase } from './config/database';
import { initializeFirebase } from './config/firebase';

const PORT = parseInt(process.env.PORT ?? '8000', 10);

async function bootstrap(): Promise<void> {
  try {
    await initializeDatabase();
    console.log('Database connected.');

    initializeFirebase();

    const app = createApp();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (${process.env.NODE_ENV ?? 'development'})`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
