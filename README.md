
# InvestPro - Complete Investment Platform

A full-stack investment platform built with React, TypeScript, TailwindCSS, and Supabase. This platform provides secure investment opportunities with manual payment confirmation and comprehensive admin management.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + TailwindCSS + React Router
- **Backend**: Supabase (Authentication, Database, Storage)
- **State Management**: React Context API
- **UI Components**: shadcn/ui
- **Styling**: TailwindCSS with responsive design

## ✨ Key Features

### 🔐 User Authentication
- User registration with wallet addresses (BTC/USDT)
- Email/password authentication
- Password reset functionality
- Role-based access control (User/Admin)

### 💰 Investment System
- 4-tier investment plans (Starter, Silver, Gold, Platinum)
- Manual deposit confirmation system
- Real-time investment tracking with countdown timers
- Reinvestment capabilities
- Comprehensive transaction history

### 📊 User Dashboard
- Balance overview and management
- Investment plan selection
- Active investment monitoring
- Transaction history
- Profile management
- Deposit functionality

### 👑 Admin Panel
- User management and balance control
- Deposit confirmation system
- Investment plan management
- Platform analytics
- System settings configuration

### 🌐 Public Pages
- Professional landing page
- About us information
- Contact form with FAQ
- Terms of service
- Responsive design across all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Environment Setup

1. **Create Supabase Project**
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key

2. **Set Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Setup**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the provided `supabase-schema.sql` file

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🗄️ Database Schema

### Core Tables
- **profiles**: User information and wallet addresses
- **investment_plans**: Available investment options
- **deposits**: Deposit confirmation requests
- **investments**: Active and completed investments
- **transactions**: Complete transaction history
- **admin_settings**: Platform configuration

### Investment Plans
- **Starter**: $50-$1,000, 5% ROI in 24 hours
- **Silver**: $1,000-$4,990, 10% ROI in 48 hours
- **Gold**: $5,000-$10,000, 15% ROI in 72 hours
- **Platinum**: $10,000+, 20% ROI in 7 days

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- User data isolation
- Admin role verification
- Encrypted authentication tokens
- Secure password handling
- Input validation and sanitization

## 📱 Responsive Design

- Mobile-first approach
- Optimized for all screen sizes
- Touch-friendly interface
- Progressive Web App capabilities

## 🛠️ Technical Stack

### Frontend Dependencies
- React 18 with TypeScript
- React Router for navigation
- TailwindCSS for styling
- shadcn/ui component library
- Lucide React for icons
- React Hook Form for forms
- Date-fns for date handling

### Backend (Supabase)
- PostgreSQL database
- Row Level Security
- Real-time subscriptions
- Authentication & authorization
- File storage capabilities

## 📋 Investment Flow

1. **User Registration**: Sign up with personal details and wallet addresses
2. **Deposit Request**: Choose amount and currency (BTC/USDT)
3. **Payment**: Send payment to provided wallet address
4. **Confirmation**: Click "I've Deposited" to create confirmation request
5. **Admin Review**: Admin manually verifies and credits balance
6. **Investment**: Choose plan and invest from available balance
7. **Tracking**: Monitor active investments with countdown timers
8. **Returns**: Automatic ROI credit upon investment completion

## 🔧 Admin Features

- **User Management**: View, edit, and manage all user accounts
- **Deposit Processing**: Review and confirm deposit requests
- **Plan Management**: Create, edit, and manage investment plans
- **Analytics**: View platform statistics and performance
- **Settings**: Configure platform-wide settings
- **Balance Control**: Manually adjust user balances when needed

## 🚀 Deployment

### Using Supabase Hosting
1. Connect your GitHub repository to Supabase
2. Configure environment variables
3. Deploy with automatic CI/CD

### Using Vercel/Netlify
1. Connect your repository
2. Set environment variables
3. Configure build settings
4. Deploy

## 🤝 Support

- **Email**: support@investpro.com
- **Phone**: +1 (555) 123-4567
- **Live Chat**: Available 24/7
- **Documentation**: Comprehensive guides included

## ⚠️ Important Notes

- This is a demo investment platform
- All wallet addresses are examples
- Implement proper KYC/AML procedures for production
- Add real payment gateway integration
- Implement proper risk management
- Ensure compliance with local regulations

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔄 Updates & Maintenance

- Regular security updates
- Feature enhancements based on user feedback
- Performance optimizations
- Bug fixes and improvements

---

**Built with ❤️ using modern web technologies**
