import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { Loader2 } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    btc_wallet: user?.btc_wallet || '',
    usdt_wallet: user?.usdt_wallet || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.btc_wallet.trim()) {
      newErrors.btc_wallet = 'BTC wallet address is required';
    }

    if (!formData.usdt_wallet.trim()) {
      newErrors.usdt_wallet = 'USDT wallet address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await updateProfile(formData);
      onSuccess();
      handleClose();
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleClose = () => {
    setFormData({
      name: user?.name || '',
      btc_wallet: user?.btc_wallet || '',
      usdt_wallet: user?.usdt_wallet || '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and wallet addresses
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="btc_wallet">BTC Wallet Address</Label>
            <Input
              id="btc_wallet"
              name="btc_wallet"
              type="text"
              value={formData.btc_wallet}
              onChange={handleChange}
              className={errors.btc_wallet ? 'border-red-500' : ''}
              placeholder="Enter your Bitcoin wallet address"
            />
            {errors.btc_wallet && <p className="text-sm text-red-500 mt-1">{errors.btc_wallet}</p>}
          </div>

          <div>
            <Label htmlFor="usdt_wallet">USDT Wallet Address</Label>
            <Input
              id="usdt_wallet"
              name="usdt_wallet"
              type="text"
              value={formData.usdt_wallet}
              onChange={handleChange}
              className={errors.usdt_wallet ? 'border-red-500' : ''}
              placeholder="Enter your USDT wallet address"
            />
            {errors.usdt_wallet && <p className="text-sm text-red-500 mt-1">{errors.usdt_wallet}</p>}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;