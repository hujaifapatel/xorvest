import mongoose from 'mongoose';

let memoryServer = null;

export async function connectDb() {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('xorvest');
    console.log('[db] MONGODB_URI not set; using an in-memory MongoDB (data resets on restart)');
  }

  await mongoose.connect(uri);
  console.log(`[db] connected to ${mongoose.connection.name}`);
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
