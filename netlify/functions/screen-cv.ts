import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';
import Busboy from 'busboy';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function parseMultipart(event: any): Promise<{
  fields: Record<string, string>;
  files: Record<string, { content: Buffer; mimeType: string }>;
}> {
  return new Promise((resolve, reject) => {
    const contentType =
      event.headers['content-type'] || event.headers['Content-Type'] || '';
    const busboy = Busboy({ headers: { 'content-type': contentType } });
    const fields: Record<string, string> = {};
    const files: Record<string, { content: Buffer; mimeType: string }> = {};

    busboy.on('field', (name: string, value: string) => {
      fields[name] = value;
    });

    busboy.on('file', (name: string, file: any, info: any) => {
      const chunks: Buffer[] = [];
      file.on('data', (chunk: Buffer) => chunks.push(chunk));
      file.on('end', () => {
        files[name] = { content: Buffer.concat(chunks), mimeType: info.mimeType };
      });
    });

    busboy.on('finish', () => resolve({ fields, files }));
    busboy.on('error', (err: any) => reject(err));

    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body || '');

    busboy.write(body);
    busboy.end();
  });
}

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { fields, files } = await parseMultipart(event);
    const jobDescription = fields.jobDescription;
    const cvFile = files.cvFile;

    if (!cvFile) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No CV uploaded.' }) };
    }
    if (!jobDescription) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Job description is required.' }) };
    }

    // Extract text — for PDF try pdf-parse, fallback to raw text
    let cvText = '';
    if (cvFile.mimeType === 'application/pdf') {
      try {
        // pdf-parse uses CommonJS exports, dynamic require works in bundled env
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(cvFile.content);
        cvText = pdfData.text;
      } catch {
        cvText = cvFile.content.toString('utf-8');
      }
    } else {
      cvText = cvFile.content.toString('utf-8');
    }

    const prompt = `
You are an expert HR AI assistant.
Analyze the following candidate's CV against the provided Job Description.

Job Description:
${jobDescription}

CV Details:
${cvText}

Extract the following information and output ONLY valid JSON without markdown wrapping:
{
  "candidateName": "Extracted name (or 'Unknown')",
  "candidateEmail": "Extracted email (or 'Not Provided')",
  "skillsDetected": ["Skill 1", "Skill 2"],
  "matchScore": 85,
  "aiSummary": "A 2-3 sentence explanation of the match score and candidate fit."
}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });

    const responseText = response.text || '';
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to parse AI response' }),
      };
    }

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (error: any) {
    console.error('Error in screen-cv function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error while processing CV.' }),
    };
  }
};
