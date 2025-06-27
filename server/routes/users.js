import express from 'express';
import { db } from '../database/init.js';

const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await db.getAsync(`
      SELECT id, email, name, role, balance, btc_wallet, usdt_wallet, created_at, updated_at
      FROM users WHERE id = ?
    `, [req.user.id]);

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { name, btc_wallet, usdt_wallet } = req.body;

    await db.runAsync(`
      UPDATE users 
      SET name = ?, btc_wallet = ?, usdt_wallet = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, btc_wallet, usdt_wallet, req.user.id]);

    const updatedUser = await db.getAsync(`
      SELECT id, email, name, role, balance, btc_wallet, usdt_wallet, created_at, updated_at
      FROM users WHERE id = ?
    `, [req.user.id]);

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;