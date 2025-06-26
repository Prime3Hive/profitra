import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0e1c36]">
      {/* Navigation Bar */}
      <header className="bg-[#0e1c36] py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-yellow-500 rounded-md p-2 mr-2">
            <span className="text-black font-bold text-xl">IP</span>
          </div>
          <span className="text-white font-bold text-xl">InvestPro</span>
        </div>
        
        <nav className="hidden md:flex space-x-8">
          <Link to="/" className="text-yellow-500 font-medium">Home</Link>
          <Link to="/about" className="text-white hover:text-yellow-500 transition-colors">About</Link>
          <Link to="/contact" className="text-white hover:text-yellow-500 transition-colors">Contact</Link>
          <Link to="/terms" className="text-white hover:text-yellow-500 transition-colors">Terms</Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <Link to="/signin" className="text-white hover:text-yellow-500 transition-colors">Login</Link>
          <Link to="/signup" className="bg-yellow-500 text-black font-medium px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors">Register</Link>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="flex-grow flex flex-col justify-center items-center text-center px-4 py-20">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Invest in Your <span className="text-yellow-500">Future</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8">
          Join thousands of investors earning consistent returns with our premium
          cryptocurrency investment platform. Start building wealth today with plans tailored to
          your financial goals.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-6 py-3 rounded-md flex items-center">
            <Link to="/signup" className="flex items-center">
              Start Investing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" className="border-gray-500 text-white hover:bg-gray-800 px-6 py-3 rounded-md">
            <Link to="/signin">Login</Link>
          </Button>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="bg-[#0a1528] py-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-4">
          <div className="text-center">
            <h3 className="text-yellow-500 text-3xl md:text-4xl font-bold">$2.5M+</h3>
            <p className="text-gray-300 mt-2">Total Investments</p>
          </div>
          <div className="text-center">
            <h3 className="text-yellow-500 text-3xl md:text-4xl font-bold">5,000+</h3>
            <p className="text-gray-300 mt-2">Active Investors</p>
          </div>
          <div className="text-center">
            <h3 className="text-yellow-500 text-3xl md:text-4xl font-bold">99.9%</h3>
            <p className="text-gray-300 mt-2">Success Rate</p>
          </div>
          <div className="text-center">
            <h3 className="text-yellow-500 text-3xl md:text-4xl font-bold">24/7</h3>
            <p className="text-gray-300 mt-2">Customer Support</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
