import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'whatsapp_saas';

if (!MONGODB_URI) {
  console.warn('Warning: MONGODB_URI is not defined in environment variables.');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: MONGODB_DB_NAME,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 20000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    const msg = e?.message || '';
    if (msg.includes('whitelist') || msg.includes('serverSelectionTimeout') || msg.includes('Could not connect to any servers')) {
      throw new Error(
        'MongoDB Atlas connection failed: Your IP address is not whitelisted in MongoDB Atlas Network Access. Please log in to cloud.mongodb.com -> Network Access and add your IP or allow 0.0.0.0/0.'
      );
    }
    throw e;
  }

  return cached.conn;
}
