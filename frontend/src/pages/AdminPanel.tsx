import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Save,
  X
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
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
  created_at: string;
  user_name?: string;
  user_email?: string;
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
interface UserInvestment {
  id: string;
  name: string;
  email: string;
  total_invested: number;
  investment_count: number;
}

const AdminPanel: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    activeInvestments: 0,
    totalVolume: 0
  });
  const [loading, setLoading] = useState(true);
  
  // State for admin settings
  const [settings, setSettings] = useState({
    btc_wallet_address: '',
    usdt_wallet_address: '',
    deposits_enabled: 'true',
    investments_enabled: 'true',
    reinvestments_enabled: 'true'
  });
  
  // State for wallet address update form
  const [btcAddress, setBtcAddress] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');
  const [isEditingWallets, setIsEditingWallets] = useState(false);
  
  // State for platform status configuration
  const [isConfiguringStatus, setIsConfiguringStatus] = useState(false);
  const [depositsEnabled, setDepositsEnabled] = useState(true);
  const [investmentsEnabled, setInvestmentsEnabled] = useState(true);
  const [reinvestmentsEnabled, setReinvestmentsEnabled] = useState(true);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      return;
    }

    fetchData();
  }, [profile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from backend API endpoints
      const [usersResponse, depositsResponse, investmentsResponse, statsResponse, settingsResponse] = await Promise.all([
        fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }),
        fetch('/api/admin/deposits/pending', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }),
        fetch('/api/admin/investments', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }),
        fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }),
        fetch('/api/admin/settings', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
      ]);

      if (!usersResponse.ok) throw new Error('Failed to fetch users');
      if (!depositsResponse.ok) throw new Error('Failed to fetch deposits');
      if (!investmentsResponse.ok) throw new Error('Failed to fetch investments');
      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      if (!settingsResponse.ok) throw new Error('Failed to fetch settings');

      const usersData = await usersResponse.json();
      const depositsData = await depositsResponse.json();
      const investmentsData = await investmentsResponse.json();
      const statsData = await statsResponse.json();
      const settingsData = await settingsResponse.json();

      setUsers(usersData || []);
      setDeposits(depositsData || []);
      setInvestments(investmentsData || []);
      setUserInvestments(statsData.userInvestments || []);
      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalDeposits: statsData.pendingDeposits || 0,
        activeInvestments: statsData.activeInvestments || 0,
        totalVolume: statsData.totalVolume || 0
      });
      
      // Set settings and initialize form values
      setSettings(settingsData);
      setBtcAddress(settingsData.btc_wallet_address || '');
      setUsdtAddress(settingsData.usdt_wallet_address || '');
      setDepositsEnabled(settingsData.deposits_enabled === 'true');
      setInvestmentsEnabled(settingsData.investments_enabled === 'true');
      setReinvestmentsEnabled(settingsData.reinvestments_enabled === 'true');
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

  const handleConfirmDeposit = async (depositId: string) => {
    try {
      const response = await fetch(`/api/admin/deposits/${depositId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to confirm deposit');

      toast({
        title: "Success",
        description: "Deposit confirmed successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm deposit",
        variant: "destructive",
      });
    }
  };

  const handleRejectDeposit = async (depositId: string) => {
    try {
      const response = await fetch(`/api/admin/deposits/${depositId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to reject deposit');

      toast({
        title: "Success",
        description: "Deposit rejected successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject deposit",
        variant: "destructive",
      });
    }
  };

  const handleUpdateWalletAddresses = async () => {
    try {
      const response = await fetch('/api/admin/wallet-addresses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          btcAddress,
          usdtAddress
        })
      });

      if (!response.ok) throw new Error('Failed to update wallet addresses');

      toast({
        title: "Success",
        description: "Wallet addresses updated successfully",
      });

      setIsEditingWallets(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update wallet addresses",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePlatformStatus = async () => {
    try {
      const response = await fetch('/api/admin/platform-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          depositsEnabled,
          investmentsEnabled,
          reinvestmentsEnabled
        })
      });

      if (!response.ok) throw new Error('Failed to update platform status');

      toast({
        title: "Success",
        description: "Platform status updated successfully",
      });

      setIsConfiguringStatus(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update platform status",
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-2xl font-bold">{stats.totalUsers}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-2xl font-bold">{stats.totalDeposits}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-2xl font-bold">{stats.activeInvestments}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-purple-500 mr-2" />
                <span className="text-2xl font-bold">${stats.totalVolume.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Wallet Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Wallet Addresses</span>
                {!isEditingWallets ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditingWallets(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Update
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditingWallets(false)}
                    >
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleUpdateWalletAddresses}
                    >
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>Manage deposit wallet addresses</CardDescription>
            </CardHeader>
            <CardContent>
              {!isEditingWallets ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">BTC Wallet Address</h3>
                    <p className="text-sm bg-gray-100 p-2 rounded break-all">
                      {settings.btc_wallet_address || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">USDT Wallet Address</h3>
                    <p className="text-sm bg-gray-100 p-2 rounded break-all">
                      {settings.usdt_wallet_address || 'Not set'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="btc-address">BTC Wallet Address</Label>
                    <Input 
                      id="btc-address" 
                      value={btcAddress} 
                      onChange={(e) => setBtcAddress(e.target.value)} 
                      placeholder="Enter BTC wallet address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="usdt-address">USDT Wallet Address</Label>
                    <Input 
                      id="usdt-address" 
                      value={usdtAddress} 
                      onChange={(e) => setUsdtAddress(e.target.value)} 
                      placeholder="Enter USDT wallet address"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Platform Status</span>
                {!isConfiguringStatus ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsConfiguringStatus(true)}
                  >
                    <Settings className="h-4 w-4 mr-1" /> Configure
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsConfiguringStatus(false)}
                    >
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleUpdatePlatformStatus}
                    >
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>Configure platform features</CardDescription>
            </CardHeader>
            <CardContent>
              {!isConfiguringStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Deposits</span>
                    <Badge variant={settings.deposits_enabled === 'true' ? 'success' : 'destructive'}>
                      {settings.deposits_enabled === 'true' ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Investments</span>
                    <Badge variant={settings.investments_enabled === 'true' ? 'success' : 'destructive'}>
                      {settings.investments_enabled === 'true' ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Reinvestments</span>
                    <Badge variant={settings.reinvestments_enabled === 'true' ? 'success' : 'destructive'}>
                      {settings.reinvestments_enabled === 'true' ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="deposits-enabled">Deposits</Label>
                    <Switch 
                      id="deposits-enabled" 
                      checked={depositsEnabled} 
                      onCheckedChange={setDepositsEnabled} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="investments-enabled">Investments</Label>
                    <Switch 
                      id="investments-enabled" 
                      checked={investmentsEnabled} 
                      onCheckedChange={setInvestmentsEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reinvestments-enabled">Reinvestments</Label>
                    <Switch 
                      id="reinvestments-enabled" 
                      checked={reinvestmentsEnabled} 
                      onCheckedChange={setReinvestmentsEnabled}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Users, Deposits, Investments */}
        <Tabs defaultValue="users" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="deposits">Pending Deposits</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="user-investments">User Investments</TabsTrigger>
          </TabsList>
          
          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Role</th>
                        <th className="text-left py-3 px-4">Balance</th>
                        <th className="text-left py-3 px-4">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length > 0 ? (
                        users.map(user => (
                          <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{user.name}</td>
                            <td className="py-3 px-4">{user.email}</td>
                            <td className="py-3 px-4">
                              <Badge variant={user.role === 'admin' ? 'outline' : 'secondary'}>
                                {user.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">${user.balance?.toFixed(2) || '0.00'}</td>
                            <td className="py-3 px-4">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Deposits Tab */}
          <TabsContent value="deposits">
            <Card>
              <CardHeader>
                <CardTitle>Pending Deposits</CardTitle>
                <CardDescription>Review and confirm deposit requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">User</th>
                        <th className="text-left py-3 px-4">Amount</th>
                        <th className="text-left py-3 px-4">Currency</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.length > 0 ? (
                        deposits.map(deposit => (
                          <tr key={deposit.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              {deposit.user_name || deposit.user_id}
                              <div className="text-xs text-gray-500">{deposit.user_email}</div>
                            </td>
                            <td className="py-3 px-4">${deposit.amount.toFixed(2)}</td>
                            <td className="py-3 px-4">{deposit.currency}</td>
                            <td className="py-3 px-4">
                              {new Date(deposit.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="warning">{deposit.status}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleConfirmDeposit(deposit.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" /> Confirm
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => handleRejectDeposit(deposit.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-gray-500">
                            No pending deposits
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Investments Tab */}
          <TabsContent value="investments">
            <Card>
              <CardHeader>
                <CardTitle>Investments</CardTitle>
                <CardDescription>View all investment activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">User</th>
                        <th className="text-left py-3 px-4">Plan</th>
                        <th className="text-left py-3 px-4">Amount</th>
                        <th className="text-left py-3 px-4">ROI</th>
                        <th className="text-left py-3 px-4">Start Date</th>
                        <th className="text-left py-3 px-4">End Date</th>
                        <th className="text-left py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investments.length > 0 ? (
                        investments.map(investment => (
                          <tr key={investment.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{investment.user_name || investment.user_id}</td>
                            <td className="py-3 px-4">{investment.plan_name || investment.plan_id}</td>
                            <td className="py-3 px-4">${investment.amount.toFixed(2)}</td>
                            <td className="py-3 px-4">${investment.roi_amount.toFixed(2)}</td>
                            <td className="py-3 px-4">
                              {new Date(investment.start_date).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              {new Date(investment.end_date).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <Badge 
                                variant={
                                  investment.status === 'active' 
                                    ? 'success' 
                                    : investment.status === 'completed' 
                                    ? 'outline' 
                                    : 'secondary'
                                }
                              >
                                {investment.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-gray-500">
                            No investments found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* User Investments Tab */}
          <TabsContent value="user-investments">
            <Card>
              <CardHeader>
                <CardTitle>User Investment Summary</CardTitle>
                <CardDescription>View total investments per user</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">User</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Total Invested</th>
                        <th className="text-left py-3 px-4">Investment Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userInvestments.length > 0 ? (
                        userInvestments.map(user => (
                          <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{user.name}</td>
                            <td className="py-3 px-4">{user.email}</td>
                            <td className="py-3 px-4">${user.total_invested.toFixed(2)}</td>
                            <td className="py-3 px-4">{user.investment_count}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-gray-500">
                            No user investments found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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