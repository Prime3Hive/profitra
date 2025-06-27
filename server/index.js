import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import investmentRoutes from './routes/investments.js';
import depositRoutes from './routes/deposits.js';
import transactionRoutes from './routes/transactions.js';
import adminRoutes from './routes/admin.js';
import { initDatabase } from './database/init.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
await initDatabase();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/investments', authenticateToken, investmentRoutes);
app.use('/api/deposits', authenticateToken, depositRoutes);
app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});