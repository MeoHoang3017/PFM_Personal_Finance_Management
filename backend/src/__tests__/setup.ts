import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Currency } from '../models';

let mongoReplSet: MongoMemoryReplSet;

// Set test environment before any imports that read process.env
process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY || 'test-access-secret-key-minimum-32-characters-long';
process.env.REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET_KEY || 'test-refresh-secret-key-minimum-32-chars';
process.env.EXCHANGE_RATE_AUTO_UPDATE = 'false';

beforeAll(async () => {
  // Use ReplSet to support MongoDB transactions (required by transaction.service, auth.service, etc.)
  mongoReplSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongoReplSet.getUri();
  await mongoose.connect(uri);
  // Seed default currencies for tests
  await Currency.insertMany([
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoReplSet.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  const exclude = ['currencies']; // Keep seeded currencies for tests
  for (const key of Object.keys(collections)) {
    if (!exclude.includes(key)) {
      await collections[key].deleteMany({});
    }
  }
});
