
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  History,
  Plus,
  RefreshCw,
  User
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import DepositModal from '@/components/DepositModal';
import InvestmentModal from '@/components/InvestmentModal';
import ProfileModal from '@/components/ProfileModal';
import WithdrawalModal from '@/components/WithdrawalModal';
import { toast } from '@/hooks/use-toast';

interface InvestmentPlan {
  id: string;
  name: string;
  min_amount: number;
  max_amount: number;
  roi_percent: number;
  duration_hours: number;
  is_active: boolean;
}

interface Investment {
  id: string;
  plan_id: string;
  amount: number;
  roi_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  plan?: InvestmentPlan;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { profile, user, refreshProfile, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);

  useEffect(() => {
    if (user?.id && !authLoading) {
      fetchData();
    }
  }, [user?.id, authLoading]);

  const fetchData = async () => {
    if (!user?.id) {
      console.error('Dashboard: No user ID available for fetching data');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Dashboard: Fetching data for user ID:', user.id);
      
      // Fetch investment plans
      const { data: plansData, error: plansError } = await supabase
        .from('investment_plans')
        .select('*')
        .eq('is_active', true)
        .order('min_amount');

      if (plansError) {
        console.error('Dashboard: Error fetching investment plans:', plansError);
        toast({
          title: "Warning",
          description: "Could not load investment plans",
          variant: "destructive",
        });
      } else {
        console.log('Dashboard: Fetched plans:', plansData?.length || 0);
        setPlans(plansData || []);
      }

      // Fetch user investments with plan details
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (investmentsError) {
        console.error('Dashboard: Error fetching investments:', investmentsError);
      } else {
        console.log('Dashboard: Fetched investments:', investmentsData?.length || 0);
        
        // Fetch plan details for each investment
        const investmentsWithPlans = await Promise.all(
          (investmentsData || []).map(async (investment) => {
            if (investment.plan_id) {
              const { data: planData } = await supabase
                .from('investment_plans')
                .select('*')
                .eq('id', investment.plan_id)
                .single();
              
              return { ...investment, plan: planData };
            }
            return investment;
          })
        );
        
        setInvestments(investmentsWithPlans);
      }

      // Fetch user transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) {
        console.error('Dashboard: Error fetching transactions:', transactionsError);
      } else {
        console.log('Dashboard: Fetched transactions:', transactionsData?.length || 0);
        setTransactions(transactionsData || []);
      }

    } catch (error) {
      console.error('Dashboard: Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setShowInvestmentModal(true);
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Completed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const activeInvestments = investments.filter(inv => inv.status === 'active');
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReturns = investments.filter(inv => inv.status === 'completed').reduce((sum, inv) => sum + inv.roi_amount, 0);

  // Show loading state while authenticating or fetching data
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {profile?.name || user?.email || 'User'}!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${profile?.balance?.toFixed(2) || '0.00'}</div>
              <Button 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => setShowDepositModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Deposit
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalInvested.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {activeInvestments.length} active investments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalReturns.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Completed investments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{profile?.role || 'User'}</div>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 w-full"
                onClick={() => setShowProfileModal(true)}
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="invest" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invest">Investment Plans</TabsTrigger>
            <TabsTrigger value="active">Active Investments</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="invest" className="space-y-6">
            {plans.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Investment Plans Available</h3>
                  <p className="text-gray-600">Investment plans will appear here when available.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className="relative overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        {plan.name}
                        <Badge variant="secondary">{plan.roi_percent}% ROI</Badge>
                      </CardTitle>
                      <CardDescription>
                        ${plan.min_amount.toLocaleString()} - {plan.max_amount ? `$${plan.max_amount.toLocaleString()}` : 'Unlimited'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-gray-600">
                        Duration: {plan.duration_hours < 24 ? `${plan.duration_hours} hours` : `${plan.duration_hours / 24} days`}
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => handleInvest(plan)}
                        disabled={!profile?.balance || profile.balance < plan.min_amount}
                      >
                        {!profile?.balance || profile.balance < plan.min_amount 
                          ? 'Insufficient Balance' 
                          : 'Invest Now'
                        }
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            {activeInvestments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Investments</h3>
                  <p className="text-gray-600 mb-4">Start investing to see your active plans here.</p>
                  <Button onClick={() => setShowDepositModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Make First Deposit
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeInvestments.map((investment) => (
                  <Card key={investment.id}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        {investment.plan?.name || 'Investment Plan'}
                        <Badge variant="default">Active</Badge>
                      </CardTitle>
                      <CardDescription>
                        Invested: ${investment.amount.toFixed(2)} • Expected: ${investment.roi_amount.toFixed(2)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {getTimeRemaining(investment.end_date)}
                        </div>
                        <div className="text-lg font-semibold text-green-600">
                          +{investment.plan?.roi_percent || 0}%
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-medium capitalize">{transaction.type.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-600">{transaction.description}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`font-semibold ${
                          transaction.type === 'deposit' || transaction.type === 'roi_return' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {transaction.type === 'deposit' || transaction.type === 'roi_return' ? '+' : '-'}
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <DepositModal 
        isOpen={showDepositModal} 
        onClose={() => setShowDepositModal(false)}
        onSuccess={() => {
          setShowDepositModal(false);
          refreshProfile();
          fetchData();
        }}
      />
      
      <InvestmentModal 
        isOpen={showInvestmentModal} 
        onClose={() => setShowInvestmentModal(false)}
        plan={selectedPlan}
        onSuccess={() => {
          setShowInvestmentModal(false);
          refreshProfile();
          fetchData();
        }}
      />
      
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)}
        onSuccess={() => {
          setShowProfileModal(false);
          refreshProfile();
        }}
      />
      
      <WithdrawalModal 
        isOpen={showWithdrawalModal} 
        onClose={() => setShowWithdrawalModal(false)}
        onSuccess={() => {
          setShowWithdrawalModal(false);
          refreshProfile();
          fetchData();
        }}
      />
    </div>
  );
};

export default Dashboard;
