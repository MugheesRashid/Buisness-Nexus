import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import dealApi from '../../services/dealApi';
import toast from 'react-hot-toast';

export const DealDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState('');

  useEffect(() => {
    fetchDeal();
  }, [id]);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const response = await dealApi.getDealById(id);
      setDeal(response);
    } catch (error) {
      console.error('Error fetching deal:', error);
      toast.error('Failed to load deal details');
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async () => {
    if (!investmentAmount || investmentAmount <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }

    try {
      setInvesting(true);
      await dealApi.investInDeal(id, parseFloat(investmentAmount));
      toast.success('Investment successful!');
      setInvestmentAmount('');
      fetchDeal(); // Refresh deal
    } catch (error) {
      toast.error('Failed to invest: ' + error.message);
    } finally {
      setInvesting(false);
    }
  };

  const hasInvested = deal?.investors?.some(inv => inv.investor === user?._id);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading deal details...</div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Deal not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{deal.startupName}</h1>
          <p className="text-gray-600">Deal Details</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/deals')}>
          Back to Deals
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Deal Information</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Startup Name</label>
                  <p className="mt-1 text-sm text-gray-900">{deal.startupName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Owner</label>
                  <div className="mt-1 flex items-center">
                    <Avatar
                      src={deal.startupOwner?.logo || 'https://via.placeholder.com/40'}
                      alt={deal.startupOwner?.name}
                      size="sm"
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">{deal.startupOwner?.name || 'Unknown'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount Raised</label>
                  <p className="mt-1 text-sm text-gray-900">${deal.amountRaised?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Amount</label>
                  <p className="mt-1 text-sm text-gray-900">${deal.targetAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Equity</label>
                  <p className="mt-1 text-sm text-gray-900">{deal.equity}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <Badge variant={deal.status === 'Open' ? 'primary' : deal.status === 'Closed' ? 'success' : 'error'}>
                    {deal.status}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Negotiation</label>
                  <p className="mt-1 text-sm text-gray-900">{deal.isNegotiationAllowed ? 'Allowed' : 'Not Allowed'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(deal.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Investors */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Investors ({deal.investors?.length || 0})</h2>
            </CardHeader>
            <CardBody>
              {deal.investors?.length > 0 ? (
                <div className="space-y-3">
                  {deal.investors.map((inv, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Avatar
                          src={inv.investor?.logo || 'https://via.placeholder.com/40'}
                          alt={inv.investor?.name}
                          size="sm"
                          className="mr-3"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{inv.investor?.name || 'Unknown Investor'}</p>
                          <p className="text-xs text-gray-500">{new Date(inv.investedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900">${inv.amount?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No investors yet</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Investment Actions */}
        <div className="space-y-6">
          {user?.role === 'investor' && deal.status === 'Open' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Invest in Deal</h2>
              </CardHeader>
              <CardBody>
                {hasInvested ? (
                  <div className="text-center">
                    <p className="text-green-600 font-medium">You have already invested in this deal</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                        Investment Amount ($)
                      </label>
                      <input
                        id="amount"
                        type="number"
                        value={investmentAmount}
                        onChange={(e) => setInvestmentAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <Button
                      onClick={handleInvest}
                      disabled={investing}
                      fullWidth
                    >
                      {investing ? 'Investing...' : 'Invest'}
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
