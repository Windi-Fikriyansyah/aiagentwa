import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();

async function testPineconeError() {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  const index = pinecone.index('whatsapp-bot');
  
  try {
    console.log("Test 4: Valid vector");
    const arr = new Array(2048).fill(0.1);
    await index.upsert([ {id: 'test', values: arr} ]);
    console.log("Test 4 Success");
  } catch(e) {
    console.error("Error 4:", e.message);
  }
}

testPineconeError();
