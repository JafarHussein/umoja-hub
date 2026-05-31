/**
 * Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpassword tsx scripts/seed-admin.ts
 *
 * Creates the initial admin user. Safe to run multiple times — skips if the
 * email already exists. Requires MONGODB_URI in the environment.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS, Role, UserStatus } from '../src/types';

async function main(): Promise<void> {
  const uri = process.env['MONGODB_URI'];
  if (!uri) throw new Error('MONGODB_URI is required');

  const email = (process.env['ADMIN_EMAIL'] ?? 'admin@umojahub.com').toLowerCase().trim();
  const password = process.env['ADMIN_PASSWORD'];
  if (!password) throw new Error('ADMIN_PASSWORD is required');

  await mongoose.connect(uri);

  const collection = mongoose.connection.collection('users');

  const existing = await collection.findOne({ email });
  if (existing) {
    console.log(`Admin ${email} already exists — skipping.`);
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const now = new Date();

  await collection.insertOne({
    email,
    hashedPassword,
    firstName: 'Admin',
    lastName: 'UmojaHub',
    phoneNumber: '+254700000000',
    role: Role.ADMIN,
    county: 'Nairobi',
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Admin user created: ${email}`);
  await mongoose.disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
