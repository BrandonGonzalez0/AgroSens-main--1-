import express from 'express';
import { getHumedad, getTemperatura, getTodo } from '../services/mqtt_state.js';

const router = express.Router();

router.get('/humedad', (req, res) => {
  try {
    const device = req.query.device || null;
    return res.json(getHumedad(device));
  } catch (e) {
    return res.status(500).json({ error: 'Could not fetch humedad' });
  }
});

router.get('/temperatura', (req, res) => {
  try {
    const device = req.query.device || null;
    return res.json(getTemperatura(device));
  } catch (e) {
    return res.status(500).json({ error: 'Could not fetch temperatura' });
  }
});

router.get('/todo', (req, res) => {
  try {
    const device = req.query.device || null;
    return res.json(getTodo(device));
  } catch (e) {
    return res.status(500).json({ error: 'Could not fetch sensors' });
  }
});

export default router;
