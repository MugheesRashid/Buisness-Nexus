import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, Calendar, TrendingUp, AlertCircle, PlusCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

import { InvestorCard } from '../../components/investor/InvestorCard';
import { useAuth } from '../../context/AuthContext';
import { fetchInvestors } from '../../services/userApi';
import { connectionApi } from '../../services/connectionApi';
import { useNavigate } from 'react-router-dom';

export const EntrepreneurDashboard = () => {
  const { user } = useAuth();
  const [collaborationRequests, setCollaborationRequests] = useState([]);
  const [recommendedInvestors, setRecommendedInvestors] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if(user.role !== 'entrepreneur') {
      navigate('/dashboard/investor');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [investorsData, sentRequestsData, connectionsData] = await Promise.all([
          fetchInvestors(),
          connectionApi.getSentRequests(),
          connectionApi.getConnections()
        ]);
        setRecommendedInvestors(investorsData.slice(0, 3));
        setCollaborationRequests(sentRequestsData);
        setConnections(connectionsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);
  

  
  if (!user) return null;
  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  const acceptedConnections = connections.filter(conn => conn.status === 'accepted');
  const acceptedConnectionsCount = acceptedConnections.length;
  const pendingRequests = collaborationRequests.filter(req => req.status === 'pending');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">Here's what's happening with your startup today</p>
        </div>
        
        <Link to="/investors">
          <Button
            leftIcon={<PlusCircle size={18} />}
          >
            Find Investors
          </Button>
        </Link>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-blue-50 border border-blue-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full mr-4">
                <Bell size={20} className="text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Pending Requests</p>
                <h3 className="text-xl font-semibold text-blue-900">{pendingRequests.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <Users size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Total Connections</p>
                <h3 className="text-xl font-semibold text-secondary-900">
                  {acceptedConnectionsCount}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Connections */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">My Connections</h2>
              <Badge variant="primary">{acceptedConnectionsCount} connections</Badge>
            </CardHeader>

            <CardBody className="space-y-4">
              {acceptedConnections.length > 0 ? (
                acceptedConnections.map(connection => (
                  <InvestorCard
                    key={connection.id}
                    investor={connection.receiver}
                    showActions={false}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <AlertCircle size={24} className="text-gray-500" />
                  </div>
                  <p className="text-gray-600">No connections yet</p>
                  <p className="text-sm text-gray-500 mt-1">When you connect with investors, they will appear here</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
        
        {/* Recommended investors */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recommended Investors</h2>
              <Link to="/investors" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                View all
              </Link>
            </CardHeader>
            
            <CardBody className="space-y-4">
              {recommendedInvestors.map(investor => (
                <InvestorCard
                  key={investor.id}
                  investor={investor}
                  showActions={false}
                />
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};