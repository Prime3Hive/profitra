import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/init.js';

const router = express.Router();

// Get investment plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await db.allAsync('SELECT * FROM investment_plans WHERE is_active = 1');
    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user investments
router.get('/', async (req, res) => {
  try {
    const investments = await db.allAsync(`
      SELECT i.*, p.name as plan_name, p.roi_percent, p.duration_hours
      FROM investments i
      JOIN investment_plans p ON i.plan_id = p.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `, [req.user.id]);

    res.json(investments);
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create investment
router.post('/', async (req, res) => {
  try {
    const { plan_id, amount, is_reinvestment = false } = req.body;

    // Get plan details
    const plan = await db.getAsync('SELECT * FROM investment_plans WHERE id = ?', [plan_id]);
    if (!plan) {
      return res.status(404).json({ error: 'Investment plan not found' });
    }

    // Validate amount
    if (amount < plan.min_amount || (plan.max_amount && amount > plan.max_amount)) {
      return res.status(400).json({ error: 'Invalid investment amount' });
    }

    // Check user balance
    if (req.user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Calculate ROI and end date
    const roi_amount = (amount * plan.roi_percent) / 100;
    const start_date = new Date();
    const end_date = new Date(start_date.getTime() + plan.duration_hours * 60 * 60 * 1000);

    const investmentId = uuidv4();

    // Create investment
    await db.runAsync(`
      INSERT INTO investments (id, user_id, plan_id, amount, roi_amount, start_date, end_date, is_reinvestment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [investmentId, req.user.id, plan_id, amount, roi_amount, start_date.toISOString(), end_date.toISOString(), is_reinvestment]);

    // Update user balance
    await db.runAsync('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, req.user.id]);

    // Create transaction record
    await db.runAsync(`
      INSERT INTO transactions (id, user_id, type, amount, description, investment_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [uuidv4(), req.user.id, is_reinvestment ? 'reinvestment' : 'investment', -amount, `${plan.name} ${is_reinvestment ? 'reinvestment' : 'investment'} - $${amount}`, investmentId]);

    res.status(201).json({ message: 'Investment created successfully', investment_id: investmentId });
  } catch (error) {
    console.error('Create investment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;