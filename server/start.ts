import app from './server';
import { prisma } from './config/prisma';

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database via Prisma');

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🏥 SmartMedChart API running on http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
