
import React from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const Terms: React.FC = () => {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing and using the InvestPro platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.`
    },
    {
      title: '2. Description of Service',
      content: `InvestPro provides an online investment platform that allows users to invest in various investment plans with predetermined returns and durations. Our platform facilitates investment opportunities but does not provide financial advice.`
    },
    {
      title: '3. User Accounts and Registration',
      content: `To use our services, you must create an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.`
    },
    {
      title: '4. Investment Terms',
      content: `All investments are subject to the terms of the specific investment plan chosen. Investment returns are not guaranteed and past performance does not indicate future results. You acknowledge that investments carry inherent risks.`
    },
    {
      title: '5. Deposits and Withdrawals',
      content: `Deposits must be made through the approved payment methods displayed on our platform. All deposits are subject to verification and approval. Withdrawal requests are processed within the timeframes specified for each investment plan.`
    },
    {
      title: '6. User Responsibilities',
      content: `Users must provide accurate information, comply with all applicable laws, and use the platform only for legitimate investment purposes. Any fraudulent activity or misuse of the platform is strictly prohibited.`
    },
    {
      title: '7. Risk Disclosure',
      content: `All investments involve risk of loss. You should carefully consider your financial situation and risk tolerance before investing. InvestPro does not guarantee any specific returns or outcomes.`
    },
    {
      title: '8. Privacy and Data Protection',
      content: `We are committed to protecting your privacy and personal information. Our collection and use of personal data is governed by our Privacy Policy, which forms part of these terms.`
    },
    {
      title: '9. Limitation of Liability',
      content: `InvestPro's liability is limited to the maximum extent permitted by law. We are not liable for any indirect, incidental, or consequential damages arising from your use of our services.`
    },
    {
      title: '10. Termination',
      content: `We reserve the right to terminate or suspend accounts that violate these terms or engage in prohibited activities. Users may close their accounts at any time, subject to completion of existing investments.`
    },
    {
      title: '11. Modifications to Terms',
      content: `We may update these terms from time to time. Users will be notified of significant changes, and continued use of the platform constitutes acceptance of updated terms.`
    },
    {
      title: '12. Contact Information',
      content: `For questions about these terms or our services, please contact us at support@investpro.com or through our customer support channels.`
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Terms of Service
          </h1>
          <p className="text-lg md:text-xl opacity-90">
            Last updated: January 1, 2024
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                InvestPro Terms of Service
              </CardTitle>
              <p className="text-center text-gray-600">
                Please read these terms carefully before using our platform.
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-8">
                  {sections.map((section, index) => (
                    <div key={index}>
                      <h2 className="text-xl font-bold text-gray-900 mb-4">
                        {section.title}
                      </h2>
                      <p className="text-gray-700 leading-relaxed mb-6">
                        {section.content}
                      </p>
                      {index < sections.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="mt-8 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <h3 className="font-bold text-yellow-800 mb-2">Important Notice</h3>
              <p className="text-yellow-700 text-sm">
                These terms constitute a legally binding agreement between you and InvestPro. 
                By using our platform, you acknowledge that you have read, understood, and 
                agree to be bound by these terms. If you have any questions about these terms, 
                please contact our support team before using our services.
              </p>
            </CardContent>
          </Card>

          {/* Risk Warning */}
          <Card className="mt-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <h3 className="font-bold text-red-800 mb-2">Risk Warning</h3>
              <p className="text-red-700 text-sm">
                All investments carry risk of loss. Past performance does not guarantee future results. 
                Please carefully consider your financial situation and risk tolerance before investing. 
                Only invest what you can afford to lose. Seek independent financial advice if necessary.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Terms;
