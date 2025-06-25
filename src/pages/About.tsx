
import React from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  Award,
  CheckCircle,
  Globe
} from 'lucide-react';

const About: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Bank-level security with encrypted transactions and secure data storage.',
    },
    {
      icon: TrendingUp,
      title: 'High Returns',
      description: 'Competitive ROI rates with proven investment strategies.',
    },
    {
      icon: Users,
      title: 'Expert Team',
      description: 'Experienced professionals managing your investments.',
    },
    {
      icon: Award,
      title: 'Proven Track Record',
      description: 'Years of successful investment management and satisfied clients.',
    },
  ];

  const stats = [
    { label: 'Active Investors', value: '10,000+' },
    { label: 'Total Investments', value: '$50M+' },
    { label: 'Success Rate', value: '98%' },
    { label: 'Countries Served', value: '50+' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About InvestPro
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
            We're dedicated to helping you grow your wealth through secure, 
            profitable investment opportunities with transparent processes and proven results.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Story
            </h2>
            <div className="space-y-6 text-lg text-gray-600 text-left">
              <p>
                Founded in 2020, InvestPro was born from a simple vision: to democratize 
                access to profitable investment opportunities while maintaining the highest 
                standards of security and transparency.
              </p>
              <p>
                Our team of experienced financial professionals and technology experts 
                came together to create a platform that bridges the gap between traditional 
                investment methods and modern digital solutions.
              </p>
              <p>
                Today, we serve thousands of investors worldwide, helping them achieve 
                their financial goals through carefully curated investment plans and 
                comprehensive support services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We combine cutting-edge technology with proven investment strategies 
              to deliver exceptional results for our clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <Globe className="h-6 w-6 mr-2 text-blue-600" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  To provide accessible, secure, and profitable investment opportunities 
                  that empower individuals to achieve financial independence and build 
                  lasting wealth.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">Transparent investment processes</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">Competitive returns with managed risk</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">24/7 customer support</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <Award className="h-6 w-6 mr-2 text-purple-600" />
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  To become the world's leading digital investment platform, 
                  recognized for innovation, security, and exceptional client outcomes.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">Global accessibility and reach</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">Continuous innovation in fintech</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm">Sustainable financial growth</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Led by Experts
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Our leadership team combines decades of experience in finance, 
            technology, and business development to guide your investments toward success.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">Financial Planning</Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">Risk Management</Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">Technology Innovation</Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">Customer Success</Badge>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
