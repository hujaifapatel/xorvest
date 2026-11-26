import dns from 'node:dns';
import mongoose from 'mongoose';

let memoryServer = null;

const FALLBACK_DNS = (process.env.MONGODB_DNS_SERVERS || '8.8.8.8,1.1.1.1').split(',').map((s) => s.trim());

export async function connectDb() {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('xorvest');
    console.log('[db] MONGODB_URI not set; using an in-memory MongoDB (data resets on restart)');
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  } catch (err) {
    // Node's resolver can fail SRV lookups on some Windows/router setups even
    // when the OS resolves them; retry once through public DNS.
    if (uri.startsWith('mongodb+srv://') && err.syscall === 'querySrv') {
      console.warn(`[db] SRV lookup failed (${err.code}); retrying via ${FALLBACK_DNS.join(', ')}`);
      dns.setServers(FALLBACK_DNS);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    } else {
      throw err;
    }
  }
  console.log(`[db] connected to ${mongoose.connection.host}/${mongoose.connection.name}`);
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
