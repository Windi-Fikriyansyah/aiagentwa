import dotenv from 'dotenv';
dotenv.config();

async function checkEmbedding() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const arr = Array(100).fill("hello world this is a test chunk to see if openrouter accepts 100 items");
  const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'nvidia/llama-nemotron-embed-vl-1b-v2:free',
      input: arr
    })
  });
  
  const data = await res.json();
  if (!res.ok) {
    console.error("FAILED:", data);
  } else {
    console.log("SUCCESS. Length:", data.data?.length);
  }
}

checkEmbedding();
