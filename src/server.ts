import app from './app';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import prisma from './prismaClient';

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Test the Prisma connection
    await prisma.$connect();
    console.log('✅ Successfully connected to PostgreSQL database');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1); // Exit if DB connection fails
  }
}

startServer();
