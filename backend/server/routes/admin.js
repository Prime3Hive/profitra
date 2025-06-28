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
    
    // Get total investment per user
    const userInvestments = await db.allAsync(`
      SELECT u.id, u.name, u.email, 
             COALESCE(SUM(i.amount), 0) as total_invested,
             COUNT(i.id) as investment_count
      FROM users u
      LEFT JOIN investments i ON u.id = i.user_id
      GROUP BY u.id
      ORDER BY total_invested DESC
    `);

    res.json({
      totalUsers: totalUsers.count,
      pendingDeposits: pendingDeposits.count,
      pendingDepositsAmount: pendingDeposits.total,
      activeInvestments: activeInvestments.count,
      totalVolume: totalVolume.total,
      userInvestments: userInvestments
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await db.allAsync('SELECT * FROM admin_settings');
    
    // Convert to key-value object for easier frontend consumption
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });
    
    res.json(settingsObj);
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update admin settings
router.post('/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings format' });
    }
    
    // Update each setting in the database
    for (const [key, value] of Object.entries(settings)) {
      await db.runAsync(`
        UPDATE admin_settings 
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE setting_key = ?
      `, [value, key]);
    }
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update admin settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update platform status
router.post('/platform-status', async (req, res) => {
  try {
    const { depositsEnabled, investmentsEnabled, reinvestmentsEnabled } = req.body;
    
    // Update settings in database
    if (depositsEnabled !== undefined) {
      await db.runAsync(`
        INSERT OR REPLACE INTO admin_settings (id, setting_key, setting_value)
        VALUES ('deposits_enabled', 'deposits_enabled', ?)
      `, [depositsEnabled ? 'true' : 'false']);
    }
    
    if (investmentsEnabled !== undefined) {
      await db.runAsync(`
        INSERT OR REPLACE INTO admin_settings (id, setting_key, setting_value)
        VALUES ('investments_enabled', 'investments_enabled', ?)
      `, [investmentsEnabled ? 'true' : 'false']);
    }
    
    if (reinvestmentsEnabled !== undefined) {
      await db.runAsync(`
        INSERT OR REPLACE INTO admin_settings (id, setting_key, setting_value)
        VALUES ('reinvestments_enabled', 'reinvestments_enabled', ?)
      `, [reinvestmentsEnabled ? 'true' : 'false']);
    }
    
    res.json({ message: 'Platform status updated successfully' });
  } catch (error) {
    console.error('Update platform status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update wallet addresses
router.post('/wallet-addresses', async (req, res) => {
  try {
    const { btcAddress, usdtAddress } = req.body;
    
    if (btcAddress) {
      await db.runAsync(`
        UPDATE admin_settings 
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE setting_key = 'btc_wallet_address'
      `, [btcAddress]);
    }
    
    if (usdtAddress) {
      await db.runAsync(`
        UPDATE admin_settings 
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE setting_key = 'usdt_wallet_address'
      `, [usdtAddress]);
    }
    
    res.json({ message: 'Wallet addresses updated successfully' });
  } catch (error) {
    console.error('Update wallet addresses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;