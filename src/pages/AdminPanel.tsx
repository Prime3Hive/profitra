
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  role: string;
  balance: number;
  created_at: string;
}

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  request_date: string;
  user_name?: string;
}

interface Investment {
  id: string;
  user_id: string;
  amount: number;
  roi_amount: number;
  status: string;
  start_date: string;
  end_date: string;
  plan_id: string;
  user_name?: string;
  plan_name?: string;
}

const AdminPanel: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    activeInvestments: 0,
    totalVolume: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AdminPanel: Profile loaded:', profile);
    if (profile?.role === 'admin') {
      console.log('AdminPanel: User is admin, fetching admin data');
      fetchAdminData();
    } else {
      console.log('AdminPanel: User is not admin, role:', profile?.role);
    }
  }, [profile]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch pending deposits
      const { data: depositsData, error: depositsError } = await supabase
        .from('deposits')
        .select('*')
        .eq('status', 'pending')
        .order('request_date', { ascending: false });

      if (depositsError) throw depositsError;

      // Get user names for deposits
      const depositsWithUserNames = await Promise.all(
        (depositsData || []).map(async (deposit) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', deposit.user_id)
            .single();
          
          return {
            ...deposit,
            user_name: userData?.name || 'Unknown User'
          };
        })
      );

      setDeposits(depositsWithUserNames);

      // Fetch all investments
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (investmentsError) throw investmentsError;

      // Get user names and plan names for investments
      const investmentsWithDetails = await Promise.all(
        (investmentsData || []).map(async (investment) => {
          const [userResult, planResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('name')
              .eq('user_id', investment.user_id)
              .single(),
            supabase
              .from('investment_plans')
              .select('name')
              .eq('id', investment.plan_id)
              .single()
          ]);
          
          return {
            ...investment,
            user_name: userResult.data?.name || 'Unknown User',
            plan_name: planResult.data?.name || 'Unknown Plan'
          };
        })
      );

      setInvestments(investmentsWithDetails);

      // Calculate stats
      const totalVolume = investmentsWithDetails?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
      const activeInvestments = investmentsWithDetails?.filter(inv => inv.status === 'active').length || 0;
      const totalDeposits = depositsWithUserNames?.reduce((sum, dep) => sum + dep.amount, 0) || 0;

      setStats({
        totalUsers: usersData?.length || 0,
        totalDeposits,
        activeInvestments,
        totalVolume
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeposit = async (depositId: string, amount: number, userId: string) => {
    try {
      // Update deposit status
      const { error: depositError } = await supabase
        .from('deposits')
        .update({ 
          status: 'confirmed',
          confirmed_date: new Date().toISOString(),
          confirmed_by: profile?.user_id
        })
        .eq('id', depositId);

      if (depositError) throw depositError;

      // Update user balance directly
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (currentUser) {
        await supabase
          .from('profiles')
          .update({ balance: (currentUser.balance || 0) + amount })
          .eq('user_id', userId);
      }

      toast({
        title: "Success",
        description: "Deposit confirmed and balance updated",
      });

      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRejectDeposit = async (depositId: string) => {
    try {
      const { error } = await supabase
        .from('deposits')
        .update({ 
          status: 'rejected',
          confirmed_date: new Date().toISOString(),
          confirmed_by: profile?.user_id
        })
        .eq('id', depositId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Deposit rejected",
      });

      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateUserBalance = async (userId: string, newBalance: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User balance updated",
      });

      fetchAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage users, deposits, and platform settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalDeposits.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {deposits.length} requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeInvestments}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalVolume.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Investment volume
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="deposits" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="deposits">Deposit Requests</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="deposits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Deposit Confirmations</CardTitle>
                <CardDescription>
                  Review and approve user deposit requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deposits.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No pending deposit requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deposits.map((deposit) => (
                      <div key={deposit.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{deposit.user_name}</h4>
                          <p className="text-sm text-gray-600">
                            ${deposit.amount.toFixed(2)} via {deposit.currency}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(deposit.request_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleConfirmDeposit(deposit.id, deposit.amount, deposit.user_id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectDeposit(deposit.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage all registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{user.name}</h4>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'admin' : 'user'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Balance: ${user.balance.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Investments</CardTitle>
                <CardDescription>
                  Monitor all platform investments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {investments.map((investment) => (
                    <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{investment.user_name}</h4>
                          <Badge variant={investment.status === 'active' ? 'default' : 'secondary'}>
                            {investment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {investment.plan_name} - ${investment.amount.toFixed(2)} 
                          (ROI: ${investment.roi_amount.toFixed(2)})
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(investment.start_date).toLocaleDateString()} - {new Date(investment.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ${(investment.amount + investment.roi_amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">Total Return</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Platform Settings
                </CardTitle>
                <CardDescription>
                  Configure platform-wide settings and parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Wallet Addresses</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">BTC Address:</label>
                          <p className="text-sm text-gray-600 font-mono">1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">USDT Address:</label>
                          <p className="text-sm text-gray-600 font-mono">TYJUrp7L3K5YKEf9e7C3qsP4h1A9vXWz7R</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Update Addresses
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Platform Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Deposits Enabled:</span>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Investments Enabled:</span>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Reinvestments Enabled:</span>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
