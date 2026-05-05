require('dotenv').config();
const express  = require('express');
const multer   = require('multer');
const cors     = require('cors');
const fetch    = require('node-fetch');
const FormData = require('form-data');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE    = 'https://generativelanguage.googleapis.com';
const GEMINI_MODEL   = 'gemini-1.5-flash';

// ─── Gemini helpers ────────────────────────────────────────────────────────────

async function uploadToGemini(buffer, mimeType) {
  const form = new FormData();
  form.append('file', buffer, { filename: 'screening.mp4', contentType: mimeType });

  const res = await fetch(
    `${GEMINI_BASE}/upload/v1beta/files?uploadType=multipart&key=${GEMINI_API_KEY}`,
    { method: 'POST', body: form, headers: form.getHeaders() },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini upload failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  const file = data.file ?? data;
  return { name: file.name, uri: file.uri };
}

async function waitForActive(fileName) {
  for (let i = 0; i < 20; i++) {
    const res  = await fetch(`${GEMINI_BASE}/v1beta/${fileName}?key=${GEMINI_API_KEY}`);
    const data = await res.json();
    if (data.state === 'ACTIVE') return;
    if (data.state === 'FAILED') throw new Error('Gemini file processing failed');
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Gemini file did not become ACTIVE within 40 s');
}

async function analyzeVideo(fileUri, prompt) {
  const res = await fetch(
    `${GEMINI_BASE}/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { file_data: { mime_type: 'video/mp4', file_uri: fileUri } },
          ],
        }],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature:        0.1,
          max_output_tokens:  1024,
        },
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini analysis failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    throw new Error('Gemini returned an unexpected response format');
  }
}

async function deleteFile(fileName) {
  await fetch(
    `${GEMINI_BASE}/v1beta/${fileName}?key=${GEMINI_API_KEY}`,
    { method: 'DELETE' },
  ).catch(() => {}); // non-fatal; Gemini auto-deletes within 48 h
}

// ─── Route ─────────────────────────────────────────────────────────────────────

app.post('/api/analyze-task', upload.single('video'), async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No video file received' });
  }
  const prompt = req.body.prompt;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body' });
  }

  let fileName = null;
  try {
    const mimeType = req.file.mimetype || 'video/mp4';
    const uploaded = await uploadToGemini(req.file.buffer, mimeType);
    fileName = uploaded.name;

    await waitForActive(fileName);
    const result = await analyzeVideo(uploaded.uri, prompt);
    await deleteFile(fileName);

    return res.json(result);
  } catch (err) {
    console.error('[analyze-task]', err.message);
    if (fileName) deleteFile(fileName).catch(() => {});
    return res.status(500).json({ error: err.message ?? 'Analysis failed' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`NeuroChain backend listening on port ${PORT}`));
