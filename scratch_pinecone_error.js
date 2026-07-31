import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();

async function testPineconeError() {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  const index = pinecone.index('whatsapp-bot');
  
  try {
    console.log("Test 1: []");
    await index.upsert([]);
  } catch(e) {
    console.error("Error 1:", e.message);
  }

  try {
    console.log("Test 2: [ {} ]");
    await index.upsert([ {} ]);
  } catch(e) {
    console.error("Error 2:", e.message);
  }

  try {
    console.log("Test 3: [ {id: '1'} ]");
    await index.upsert([ {id: '1'} ]);
  } catch(e) {
    console.error("Error 3:", e.message);
  }
}

testPineconeError();
