import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const PUBLIC_MODELS_DIR = path.join(__dirname, '..', 'public_models');

router.get('/', async (req, res) => {
  try {
    await fs.mkdir(PUBLIC_MODELS_DIR, { recursive: true });
    const items = await fs.readdir(PUBLIC_MODELS_DIR, { withFileTypes: true });
    const folders = items.filter(i => i.isDirectory()).map(d => d.name);
    return res.json({ models: folders });
  } catch (e) {
    console.error('/api/models error', e);
    return res.status(500).json({ error: String(e) });
  }
});

export default router;
