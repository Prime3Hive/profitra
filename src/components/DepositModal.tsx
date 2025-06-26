import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const WALLET_ADDRESSES = {
  BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  USDT: 'TYJUrp7L3K5YKEf9e7C3qsP4h1A9vXWz7R'
};

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { profile } = useAuth();
  const [step, setStep] = useState<'select' | 'deposit' | 'confirm'>('select');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'BTC' | 'USDT'>('BTC');
  const [loading, setLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(WALLET_ADDRESSES[currency]);
      setCopiedAddress(true);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy address",
        variant: "destructive",
      });
    }
  };

  const handleNext = () => {
    if (step === 'select') {
      const amountNum = parseFloat(amount);
      if (!amountNum || amountNum <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }
      setStep('deposit');
    } else if (step === 'deposit') {
      setStep('confirm');
    }
  };

  const handleConfirmDeposit = async () => {
    if (!profile) {
      console.error('DepositModal: No profile available for deposit');
      toast({
        title: "Error",
        description: "User profile not found. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('DepositModal: Creating deposit request for user ID:', profile.id);
      const { data: depositData, error: depositError } = await supabase
        .from('deposit_requests')
        .insert([
          {
            user_id: profile.id,
            amount: parseFloat(amount),
            currency,
            wallet_address: WALLET_ADDRESSES[currency],
            status: 'pending'
          },
        ])
        .select();

      if (depositError) {
        console.error('DepositModal: Error creating deposit request:', depositError);
        throw depositError;
      }
      
      console.log('DepositModal: Deposit request created successfully:', depositData);

      // Create transaction record
      console.log('DepositModal: Creating transaction record');
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: profile.id,
            type: 'deposit',
            amount: parseFloat(amount),
            status: 'pending',
            description: `${currency} deposit request - $${amount}`,
          },
        ])
        .select();

      if (transactionError) {
        console.error('DepositModal: Error creating transaction record:', transactionError);
        // Don't throw here, as the deposit request was already created
        console.warn('DepositModal: Deposit request created but transaction record failed');
      } else {
        console.log('DepositModal: Transaction record created successfully:', transactionData);
      }

      toast({
        title: "Success!",
        description: "Deposit confirmation submitted. Admin will review and credit your account.",
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('DepositModal: Error in handleConfirmDeposit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process deposit request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setAmount('');
    setCurrency('BTC');
    setCopiedAddress(false);
    onClose();
  };

  const renderStepContent = () => {
    switch (step) {
      case 'select':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="amount">Deposit Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount in USD"
                min="1"
                step="0.01"
              />
            </div>

            <div>
              <Label>Select Currency</Label>
              <RadioGroup value={currency} onValueChange={(value) => setCurrency(value as 'BTC' | 'USDT')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BTC" id="btc" />
                  <Label htmlFor="btc" className="flex items-center cursor-pointer">
                    Bitcoin (BTC)
                    <Badge variant="secondary" className="ml-2">Popular</Badge>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="USDT" id="usdt" />
                  <Label htmlFor="usdt" className="cursor-pointer">Tether (USDT)</Label>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={handleNext} className="w-full">
              Continue
            </Button>
          </div>
        );

      case 'deposit':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Send {currency} Payment</h3>
              <p className="text-gray-600 mb-4">
                Send ${amount} worth of {currency} to the address below:
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-sm font-medium text-gray-700">
                {currency} Wallet Address:
              </Label>
              <div className="flex items-center space-x-2 mt-2">
                <code className="flex-1 text-sm bg-white p-2 border rounded font-mono break-all">
                  {WALLET_ADDRESSES[currency]}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyAddress}
                  disabled={copiedAddress}
                >
                  {copiedAddress ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Only send {currency} to this address. 
                Sending other cryptocurrencies may result in permanent loss.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('select')}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleNext}>
                I've Sent Payment
              </Button>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Confirm Your Deposit</h3>
              <p className="text-gray-600">
                Please confirm that you have sent the payment to complete your deposit request.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">${amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Currency:</span>
                <span className="font-medium">{currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant="outline">Pending Review</Badge>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                Your deposit request will be reviewed by our admin team. 
                Once confirmed, the funds will be credited to your account balance.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('deposit')}>
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleConfirmDeposit}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Confirm Deposit'}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' && 'Make a Deposit'}
            {step === 'deposit' && 'Send Payment'}
            {step === 'confirm' && 'Confirm Deposit'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && 'Choose your deposit amount and currency'}
            {step === 'deposit' && 'Send your payment to the provided wallet address'}
            {step === 'confirm' && 'Confirm your deposit request for admin review'}
          </DialogDescription>
        </DialogHeader>
        
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;
