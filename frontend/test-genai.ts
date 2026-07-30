import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

async function main() {
  try {
    console.log(Object.keys(GoogleGenAI.prototype));
  } catch (e) {
    console.log(e);
  }
}

main();
