import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import dealApi from '../../services/dealApi';

export const CreateDealPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth()
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startupName: '',
    minAmount: '',
    maxAmount: '',
    equity: '',
    isNegotiationAllowed: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dealData = {
        ...formData,
        minAmount: parseFloat(formData.minAmount),
        maxAmount: parseFloat(formData.maxAmount),
        equity: parseFloat(formData.equity)
      };

      await dealApi.createDeal(dealData);
      navigate('/deals');
    } catch (error) {
      console.error('Error creating deal:', error);
      alert('Failed to create deal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not entrepreneur
  if (user?.role !== 'entrepreneur') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only entrepreneurs can create deals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Investment Deal</h1>
        <p className="text-gray-600 mt-2">Fill in the details to create a new investment opportunity</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Deal Information</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="startupName" className="block text-sm font-medium text-gray-700 mb-2">
                Startup Name *
              </label>
              <Input
                id="startupName"
                name="startupName"
                type="text"
                value={formData.startupName}
                onChange={handleInputChange}
                placeholder="Enter your startup name"
                required
                fullWidth
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="minAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Investment Amount *
                </label>
                <Input
                  id="minAmount"
                  name="minAmount"
                  type="number"
                  value={formData.minAmount}
                  onChange={handleInputChange}
                  placeholder="10000"
                  required
                  fullWidth
                />
              </div>

              <div>
                <label htmlFor="maxAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Investment Amount *
                </label>
                <Input
                  id="maxAmount"
                  name="maxAmount"
                  type="number"
                  value={formData.maxAmount}
                  onChange={handleInputChange}
                  placeholder="500000"
                  required
                  fullWidth
                />
              </div>
            </div>

            <div>
              <label htmlFor="equity" className="block text-sm font-medium text-gray-700 mb-2">
                Equity Offered (%) *
              </label>
              <Input
                id="equity"
                name="equity"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.equity}
                onChange={handleInputChange}
                placeholder="15"
                required
                fullWidth
              />
            </div>

            <div className="flex items-center">
              <input
                id="isNegotiationAllowed"
                name="isNegotiationAllowed"
                type="checkbox"
                checked={formData.isNegotiationAllowed}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="isNegotiationAllowed" className="ml-2 block text-sm text-gray-900">
                Allow negotiation on terms
              </label>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/deals')}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                fullWidth
              >
                {loading ? 'Creating...' : 'Create Deal'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
