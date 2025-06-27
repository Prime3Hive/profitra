import express from 'express';
import { db } from '../database/init.js';

const router = express.Router();

// Get user transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await db.allAsync(`
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [req.user.id]);

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;