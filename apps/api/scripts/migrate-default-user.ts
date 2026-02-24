/**
 * One-time migration: convert strategies with userId "default-user" (string)
 * to use ObjectId ref to a placeholder User document.
 *
 * Run: npx ts-node -r tsconfig-paths/register scripts/migrate-default-user.ts
 * Or: npm run migrate:default-user (add script to package.json)
 */
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/str';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No database connection');

  const strategies = db.collection('strategies');
  const users = db.collection('users');

  const legacyCount = await strategies.countDocuments({ userId: 'default-user' });
  if (legacyCount === 0) {
    console.log('No strategies with userId "default-user" found. Nothing to migrate.');
    await mongoose.disconnect();
    return;
  }

  let defaultUser = await users.findOne({ email: 'default-user@migration.local' });
  if (!defaultUser) {
    const passwordHash = await bcrypt.hash('migration-placeholder-' + Date.now(), 10);
    const result = await users.insertOne({
      email: 'default-user@migration.local',
      passwordHash,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    defaultUser = await users.findOne({ _id: result.insertedId });
    if (!defaultUser) throw new Error('Failed to create default user');
    console.log('Created placeholder User:', defaultUser._id.toString());
  }

  const { modifiedCount } = await strategies.updateMany(
    { userId: 'default-user' },
    { $set: { userId: defaultUser._id } },
  );
  console.log(`Migrated ${modifiedCount} strategies to User ${defaultUser._id}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
