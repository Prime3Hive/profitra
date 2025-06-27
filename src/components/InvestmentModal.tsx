import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

interface InvestmentPlan {
  id: string;
  name: string;
  min_amount: number;
  max_amount: number;
  roi_percent: number;
  duration_hours: number;
}

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: InvestmentPlan | null;
  onSuccess: () => void;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({ isOpen, onClose, plan, onSuccess }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [isReinvestment, setIsReinvestment] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!plan) return null;

  const amountNum = parseFloat(amount) || 0;
  const roiAmount = (amountNum * plan.roi_percent) / 100;
  const totalReturn = amountNum + roiAmount;

  const handleInvest = async () => {
    if (!user) return;

    if (amountNum < plan.min_amount) {
      toast({
        title: "Invalid Amount",
        description: `Minimum investment is $${plan.min_amount}`,
        variant: "destructive",
      });
      return;
    }

    if (plan.max_amount && amountNum > plan.max_amount) {
      toast({
        title: "Invalid Amount",
        description: `Maximum investment is $${plan.max_amount}`,
        variant: "destructive",
      });
      return;
    }

    if (amountNum > user.balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this investment",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await apiClient.createInvestment({
        plan_id: plan.id,
        amount: amountNum,
        is_reinvestment: isReinvestment
      });

      toast({
        title: "Investment Successful!",
        description: `Your $${amountNum} investment in ${plan.name} has been activated.`,
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setIsReinvestment(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invest in {plan.name}</DialogTitle>
          <DialogDescription>
            Choose your investment amount for the {plan.name} plan
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Plan Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan:</span>
              <span className="font-medium">{plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ROI:</span>
              <Badge variant="secondary">{plan.roi_percent}%</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">
                {plan.duration_hours < 24 ? `${plan.duration_hours} hours` : `${plan.duration_hours / 24} days`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Range:</span>
              <span className="font-medium">
                ${plan.min_amount} - {plan.max_amount ? `$${plan.max_amount}` : 'Unlimited'}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor="amount">Investment Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min: $${plan.min_amount}`}
              min={plan.min_amount}
              max={plan.max_amount || undefined}
              step="0.01"
            />
            <p className="text-sm text-gray-500 mt-1">
              Available balance: ${user?.balance?.toFixed(2) || '0.00'}
            </p>
          </div>

          {/* Reinvestment Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reinvestment"
              checked={isReinvestment}
              onCheckedChange={(checked) => setIsReinvestment(checked as boolean)}
            />
            <Label htmlFor="reinvestment" className="text-sm">
              Mark as reinvestment
            </Label>
          </div>

          {/* Investment Summary */}
          {amountNum > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-blue-900">Investment Summary</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Investment:</span>
                  <span>${amountNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ROI ({plan.roi_percent}%):</span>
                  <span className="text-green-600">+${roiAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total Return:</span>
                  <span className="text-green-600">${totalReturn.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleInvest}
              disabled={loading || !amountNum || amountNum < plan.min_amount}
            >
              {loading ? 'Processing...' : 'Invest Now'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvestmentModal;