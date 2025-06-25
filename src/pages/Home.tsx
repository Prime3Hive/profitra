
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Shield, 
  Clock, 
  Users,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const investmentPlans = [
  {
    name: 'Starter',
    minAmount: 50,
    maxAmount: 1000,
    roi: 5,
    duration: '24 hours',
    color: 'bg-green-500'
  },
  {
    name: 'Silver',
    minAmount: 1000,
    maxAmount: 4990,
    roi: 10,
    duration: '48 hours',
    color: 'bg-gray-400'
  },
  {
    name: 'Gold',
    minAmount: 5000,
    maxAmount: 10000,
    roi: 15,
    duration: '72 hours',
    color: 'bg-yellow-500'
  },
  {
    name: 'Platinum',
    minAmount: 10000,
    maxAmount: null,
    roi: 20,
    duration: '7 days',
    color: 'bg-purple-500'
  }
];

const features = [
  {
    icon: Shield,
    title: 'Secure Platform',
    description: 'Bank-level security with encrypted transactions and secure wallet storage.'
  },
  {
    icon: TrendingUp,
    title: 'High Returns',
    description: 'Competitive ROI rates up to 20% with flexible investment plans.'
  },
  {
    icon: Clock,
    title: 'Quick Payouts',
    description: 'Fast processing times with investments maturing in 24 hours to 7 days.'
  },
  {
    icon: Users,
    title: '24/7 Support',
    description: 'Round-the-clock customer support to help with your investments.'
  }
];

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Grow Your Wealth with
              <span className="block text-yellow-300">Smart Investments</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Join thousands of investors earning consistent returns with our proven investment strategies and secure platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                <Link to="/signup">Start Investing Today</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-blue-600">
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Plans Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Investment Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Flexible plans designed to match your investment goals and risk appetite.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {investmentPlans.map((plan, index) => (
              <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`h-2 ${plan.color}`} />
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    ${plan.minAmount.toLocaleString()} - {plan.maxAmount ? `$${plan.maxAmount.toLocaleString()}` : 'Unlimited'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="text-3xl font-bold text-green-600">
                    {plan.roi}% ROI
                  </div>
                  <div className="text-gray-600">
                    Duration: {plan.duration}
                  </div>
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    Popular Choice
                  </Badge>
                  <Button asChild className="w-full">
                    <Link to="/signup">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose InvestPro?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide the tools and security you need to grow your investments safely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Investment Journey?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join our community of successful investors and start earning returns today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link to="/signup">
                Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-gray-900">
              <Link to="/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">InvestPro</h3>
              <p className="text-gray-400">
                Your trusted partner for secure and profitable investments.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Account</h4>
              <ul className="space-y-2">
                <li><Link to="/signin" className="text-gray-400 hover:text-white">Sign In</Link></li>
                <li><Link to="/signup" className="text-gray-400 hover:text-white">Sign Up</Link></li>
                <li><Link to="/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <p className="text-gray-400">
                Email: support@investpro.com<br />
                Phone: +1 (555) 123-4567
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 InvestPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
