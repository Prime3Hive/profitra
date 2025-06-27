import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'investpro.db');
const db = new sqlite3.Database(dbPath);

// Promisify database methods
db.runAsync = promisify(db.run.bind(db));
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));

export const initDatabase = async () => {
  try {
    // Users table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        btc_wallet TEXT,
        usdt_wallet TEXT,
        role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        balance DECIMAL(12,2) DEFAULT 0.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Investment plans table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS investment_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        min_amount DECIMAL(12,2) NOT NULL,
        max_amount DECIMAL(12,2),
        roi_percent DECIMAL(5,2) NOT NULL,
        duration_hours INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Investments table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS investments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        roi_amount DECIMAL(12,2) NOT NULL,
        start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_date DATETIME NOT NULL,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
        is_reinvestment BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (plan_id) REFERENCES investment_plans(id)
      )
    `);

    // Deposits table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS deposits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        currency TEXT NOT NULL CHECK (currency IN ('BTC', 'USDT')),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
        request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        confirmed_date DATETIME,
        confirmed_by TEXT,
        transaction_hash TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (confirmed_by) REFERENCES users(id)
      )
    `);

    // Deposit requests table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS deposit_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency TEXT NOT NULL CHECK (currency IN ('BTC', 'USDT')),
        wallet_address TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Withdrawal requests table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS withdrawal_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency TEXT NOT NULL CHECK (currency IN ('BTC', 'USDT')),
        wallet_address TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Transactions table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('deposit', 'investment', 'roi_return', 'reinvestment', 'withdrawal')),
        amount DECIMAL(12,2) NOT NULL,
        description TEXT NOT NULL,
        investment_id TEXT,
        deposit_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (investment_id) REFERENCES investments(id),
        FOREIGN KEY (deposit_id) REFERENCES deposits(id)
      )
    `);

    // Admin settings table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id TEXT PRIMARY KEY,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default investment plans
    const plansExist = await db.getAsync('SELECT COUNT(*) as count FROM investment_plans');
    if (plansExist.count === 0) {
      const plans = [
        { id: 'starter', name: 'Starter Plan', min_amount: 100, max_amount: 1000, roi_percent: 5, duration_hours: 24 },
        { id: 'growth', name: 'Growth Plan', min_amount: 1000, max_amount: 5000, roi_percent: 7.5, duration_hours: 48 },
        { id: 'premium', name: 'Premium Plan', min_amount: 5000, max_amount: 20000, roi_percent: 10, duration_hours: 72 },
        { id: 'elite', name: 'Elite Plan', min_amount: 20000, max_amount: null, roi_percent: 15, duration_hours: 120 }
      ];

      for (const plan of plans) {
        await db.runAsync(`
          INSERT INTO investment_plans (id, name, min_amount, max_amount, roi_percent, duration_hours)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [plan.id, plan.name, plan.min_amount, plan.max_amount, plan.roi_percent, plan.duration_hours]);
      }
    }

    // Insert default admin settings
    const settingsExist = await db.getAsync('SELECT COUNT(*) as count FROM admin_settings');
    if (settingsExist.count === 0) {
      const settings = [
        { id: 'btc_wallet', key: 'btc_wallet_address', value: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
        { id: 'usdt_wallet', key: 'usdt_wallet_address', value: 'TYJUrp7L3K5YKEf9e7C3qsP4h1A9vXWz7R' },
        { id: 'min_withdrawal', key: 'min_withdrawal_amount', value: '10.00' }
      ];

      for (const setting of settings) {
        await db.runAsync(`
          INSERT INTO admin_settings (id, setting_key, setting_value)
          VALUES (?, ?, ?)
        `, [setting.id, setting.key, setting.value]);
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export { db };