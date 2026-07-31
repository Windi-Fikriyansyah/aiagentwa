import dotenv from 'dotenv';
dotenv.config();

async function checkEmbedding() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'nvidia/llama-nemotron-embed-vl-1b-v2:free',
      input: ['hello world', 'second chunk']
    })
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

checkEmbedding();
