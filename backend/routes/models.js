import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { validatePath } from '../middleware/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const PUBLIC_MODELS_DIR = path.join(__dirname, '..', 'public_models');

router.get('/', async (req, res) => {
  try {
    // Secure path resolution
    const resolvedDir = path.resolve(PUBLIC_MODELS_DIR);
    const basePath = path.resolve(__dirname, '..');
    
    // Ensure the resolved directory is within the expected base path
    if (!resolvedDir.startsWith(basePath)) {
      console.error('Path traversal attempt detected:', resolvedDir);
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await fs.mkdir(resolvedDir, { recursive: true, mode: 0o755 });
    
    const items = await fs.readdir(resolvedDir, { withFileTypes: true });
    const folders = items
      .filter(i => i.isDirectory())
      .map(d => d.name)
      .filter(name => {
        // Validate folder names to prevent path traversal
        const validatedName = validatePath(name);
        return validatedName && validatedName === name;
      })
      .slice(0, 50); // Limit number of results
    
    return res.json({ models: folders });
  } catch (e) {
    console.error('/api/models error', e);
    return res.status(500).json({ 
      error: 'Models listing failed',
      code: 'MODELS_ERROR'
    });
  }
});

// GET specific model info with path validation
router.get('/:modelName', async (req, res) => {
  try {
    const { modelName } = req.params;
    
    // Validate model name
    const validatedName = validatePath(modelName);
    if (!validatedName) {
      return res.status(400).json({ error: 'Invalid model name' });
    }
    
    const modelDir = path.resolve(PUBLIC_MODELS_DIR, validatedName);
    const basePath = path.resolve(PUBLIC_MODELS_DIR);
    
    // Ensure the model directory is within the public models directory
    if (!modelDir.startsWith(basePath)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if model directory exists
    try {
      const stats = await fs.stat(modelDir);
      if (!stats.isDirectory()) {
        return res.status(404).json({ error: 'Model not found' });
      }
    } catch {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    // List model files
    const files = await fs.readdir(modelDir, { withFileTypes: true });
    const modelFiles = files
      .filter(f => f.isFile())
      .map(f => f.name)
      .filter(name => /\.(json|bin)$/.test(name)) // Only allow model files
      .slice(0, 20); // Limit results
    
    return res.json({ 
      modelName: validatedName,
      files: modelFiles
    });
  } catch (e) {
    console.error('/api/models/:modelName error', e);
    return res.status(500).json({ 
      error: 'Model info retrieval failed',
      code: 'MODEL_INFO_ERROR'
    });
  }
});

export default router;
