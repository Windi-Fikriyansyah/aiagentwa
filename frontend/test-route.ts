import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function main() {
  try {
    const form = new FormData();
    form.append('type', 'URL');
    form.append('url', 'https://example.com');

    const response = await fetch('http://localhost:3000/api/knowledge', {
      method: 'POST',
      body: form
    });
    const data = await response.text();
    console.log("Status:", response.status);
    console.log("Data:", data);
  } catch (e) {
    console.error(e);
  }
}
main();
