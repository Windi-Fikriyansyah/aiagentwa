import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();

async function testPinecone() {
  try {
    console.log("Checking API Keys...");
    if (!process.env.OPENROUTER_API_KEY || !process.env.PINECONE_API_KEY) {
      console.log("Missing keys");
      return;
    }

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    const indexName = 'whatsapp-bot';
    
    // Embed
    console.log("Fetching embeddings...");
    const embeddingsRes = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'nvidia/llama-nemotron-embed-vl-1b-v2:free',
        input: ["This is a test chunk to insert into Pinecone"]
      })
    });

    const embeddingsData = await embeddingsRes.json();
    if (!embeddingsRes.ok) {
      throw new Error(`OpenRouter Embedding failed: ${JSON.stringify(embeddingsData)}`);
    }

    const vectors = embeddingsData.data.map((emb, idx) => ({
      id: `test-id-${idx}`,
      values: emb.embedding,
      metadata: {
        sourceId: 'test-source',
        text: "This is a test chunk to insert into Pinecone"
      }
    }));

    // Upsert
    console.log(`Upserting ${vectors.length} vectors to Pinecone...`);
    const index = pinecone.index(indexName);
    await index.upsert(vectors);
    console.log("Upsert Success!");
  } catch(e) {
    console.error("Test Failed:", e);
  }
}

testPinecone();
