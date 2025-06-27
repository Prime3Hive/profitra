import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/init.js';

const router = express.Router();

// Get user deposits
router.get('/', async (req, res) => {
  try {
    const deposits = await db.allAsync(`
      SELECT * FROM deposit_requests WHERE user_id = ? ORDER BY created_at DESC
    `, [req.user.id]);

    res.json(deposits);
  } catch (error) {
    console.error('Get deposits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create deposit request
router.post('/request', async (req, res) => {
  try {
    const { amount, currency, wallet_address } = req.body;

    const depositId = uuidv4();

    await db.runAsync(`
      INSERT INTO deposit_requests (id, user_id, amount, currency, wallet_address)
      VALUES (?, ?, ?, ?, ?)
    `, [depositId, req.user.id, amount, currency, wallet_address]);

    // Create transaction record
    await db.runAsync(`
      INSERT INTO transactions (id, user_id, type, amount, description)
      VALUES (?, ?, ?, ?, ?)
    `, [uuidv4(), req.user.id, 'deposit', amount, `${currency} deposit request - $${amount}`]);

    res.status(201).json({ message: 'Deposit request created successfully', deposit_id: depositId });
  } catch (error) {
    console.error('Create deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;