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
    const resolvedDir = path.resolve(PUBLIC_MODELS_DIR);
    await fs.mkdir(resolvedDir, { recursive: true });
    const items = await fs.readdir(resolvedDir, { withFileTypes: true });
    const folders = items.filter(i => i.isDirectory()).map(d => d.name);
    return res.json({ models: folders });
  } catch (e) {
    console.error('/api/models error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
