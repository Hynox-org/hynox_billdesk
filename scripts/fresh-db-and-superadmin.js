/**
 * Fresh Database Reset & Single Super Admin Creation Script
 *
 * This script:
 * 1. Connects to MongoDB Atlas using settings from .env
 * 2. Empties all collections: tenants, users, categories, products, orders
 * 3. Creates one Super Admin account with full permissions
 * 4. Leaves the system completely clean for fresh vendor onboarding
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. Read .env file manually so we don't depend on dotenv
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found at:', envPath);
    process.exit(1);
  }

  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      let key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const env = loadEnv();
const MONGODB_URI = process.env.MONGODB_URI || env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || env.MONGODB_DB_NAME || 'whatsapp_saas';

// Super Admin configuration (can be overridden via environment or arguments)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.argv[2] || 'admin@saas.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.argv[3] || 'admin123456';
const ADMIN_NAME = 'System Super Admin';

async function run() {
  console.log('\n======================================================');
  console.log('   DATABASE CLEANUP & SUPER ADMIN INITIALIZATION     ');
  console.log('======================================================\n');

  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not set in .env');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB Atlas Database: [${MONGODB_DB_NAME}]...`);

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 15000,
    });
    console.log('Connected to MongoDB Atlas successfully!\n');
  } catch (err) {
    console.error('\nFAILED to connect to MongoDB Atlas:');
    console.error(err.message);
    console.error('\n------------------------------------------------------');
    console.error('COMMON REASON: MongoDB Atlas Network IP Access Restriction');
    console.error('Your machine IP is not whitelisted in MongoDB Atlas.');
    console.error('To fix this:');
    console.error('1. Log into your MongoDB Atlas console (https://cloud.mongodb.com)');
    console.error('2. Navigate to "Network Access" under "Security" in the left sidebar.');
    console.error('3. Click "Add IP Address".');
    console.error('4. Choose either:');
    console.error('   - "Allow Access from Anywhere" (0.0.0.0/0) [Recommended for dev]');
    console.error('   - OR click "Add Current IP Address".');
    console.error('5. Wait ~30 seconds for the rule to apply, then re-run this script.');
    console.error('------------------------------------------------------\n');
    process.exit(1);
  }

  try {
    const db = mongoose.connection.db;

    // List of collections to clean
    const collections = ['users', 'tenants', 'categories', 'products', 'orders'];
    console.log('Purging existing data collections:');

    for (const colName of collections) {
      try {
        const collection = db.collection(colName);
        const count = await collection.countDocuments();
        if (count > 0) {
          await collection.deleteMany({});
          console.log(`  - Cleared [${colName}]: Removed ${count} record(s)`);
        } else {
          console.log(`  - Collection [${colName}] is already empty`);
        }
      } catch (colErr) {
        // Collection might not exist yet, which is fine
        console.log(`  - Collection [${colName}]: ready`);
      }
    }

    console.log('\nGenerating Super Admin account...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const usersCollection = db.collection('users');
    const result = await usersCollection.insertOne({
      fullName: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase().trim(),
      passwordHash: passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('Super Admin successfully created!\n');
    console.log('======================================================');
    console.log('   FRESH SYSTEM READY FOR NEW REGISTRATIONS           ');
    console.log('======================================================');
    console.log(`Super Admin ID    : ${result.insertedId}`);
    console.log(`Super Admin Name  : ${ADMIN_NAME}`);
    console.log(`Super Admin Email : ${ADMIN_EMAIL}`);
    console.log(`Super Admin Pass  : ${ADMIN_PASSWORD}`);
    console.log(`Admin Portal URL  : http://localhost:3000/admin`);
    console.log(`Login URL         : http://localhost:3000/login`);
    console.log(`Register Vendor   : http://localhost:3000/register`);
    console.log('======================================================\n');
    console.log('All vendor/demo data is now completely removed.');
    console.log('You can now register fresh vendors and manage them in the Super Admin dashboard.\n');
  } catch (err) {
    console.error('Error during data wipe and admin creation:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
    process.exit(0);
  }
}

run();
