import dotenv from 'dotenv';
dotenv.config();

async function checkEmbedding() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("No OPENROUTER_API_KEY in .env");
    return;
  }
  
  const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'nvidia/llama-nemotron-embed-vl-1b-v2:free',
      input: 'hello world'
    })
  });
  
  const data = await res.json();
  if (data.data && data.data[0] && data.data[0].embedding) {
    console.log("SUCCESS! Dimension is: " + data.data[0].embedding.length);
  } else {
    console.log("FAILED:", data);
  }
}

checkEmbedding();
