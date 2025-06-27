import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/init.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply admin middleware to all routes
router.use(requireAdmin);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await db.allAsync(`
      SELECT id, email, name, role, balance, created_at, updated_at
      FROM users ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending deposits
router.get('/deposits/pending', async (req, res) => {
  try {
    const deposits = await db.allAsync(`
      SELECT dr.*, u.name as user_name, u.email as user_email
      FROM deposit_requests dr
      JOIN users u ON dr.user_id = u.id
      WHERE dr.status = 'pending'
      ORDER BY dr.created_at DESC
    `);
    res.json(deposits);
  } catch (error) {
    console.error('Get pending deposits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Confirm deposit
router.post('/deposits/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;

    // Get deposit request
    const deposit = await db.getAsync('SELECT * FROM deposit_requests WHERE id = ?', [id]);
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    // Update deposit status
    await db.runAsync(`
      UPDATE deposit_requests 
      SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [id]);

    // Update user balance
    await db.runAsync('UPDATE users SET balance = balance + ? WHERE id = ?', [deposit.amount, deposit.user_id]);

    // Create transaction record
    await db.runAsync(`
      INSERT INTO transactions (id, user_id, type, amount, description)
      VALUES (?, ?, ?, ?, ?)
    `, [uuidv4(), deposit.user_id, 'deposit', deposit.amount, `${deposit.currency} deposit confirmed - $${deposit.amount}`]);

    res.json({ message: 'Deposit confirmed successfully' });
  } catch (error) {
    console.error('Confirm deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject deposit
router.post('/deposits/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    await db.runAsync(`
      UPDATE deposit_requests 
      SET status = 'rejected', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [id]);

    res.json({ message: 'Deposit rejected successfully' });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all investments
router.get('/investments', async (req, res) => {
  try {
    const investments = await db.allAsync(`
      SELECT i.*, u.name as user_name, p.name as plan_name
      FROM investments i
      JOIN users u ON i.user_id = u.id
      JOIN investment_plans p ON i.plan_id = p.id
      ORDER BY i.created_at DESC
      LIMIT 50
    `);
    res.json(investments);
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get platform stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await db.getAsync('SELECT COUNT(*) as count FROM users');
    const pendingDeposits = await db.getAsync('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM deposit_requests WHERE status = "pending"');
    const activeInvestments = await db.getAsync('SELECT COUNT(*) as count FROM investments WHERE status = "active"');
    const totalVolume = await db.getAsync('SELECT COALESCE(SUM(amount), 0) as total FROM investments');

    res.json({
      totalUsers: totalUsers.count,
      pendingDeposits: pendingDeposits.count,
      pendingDepositsAmount: pendingDeposits.total,
      activeInvestments: activeInvestments.count,
      totalVolume: totalVolume.total
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;