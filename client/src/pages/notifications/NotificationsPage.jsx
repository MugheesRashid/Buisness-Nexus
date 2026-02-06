import React, { useState, useEffect } from 'react';
import { Bell, MessageCircle, UserPlus, DollarSign, Check, X, Clock, UserCheck, UserX } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { connectionApi } from '../../services/connectionApi';
import toast from 'react-hot-toast';

export const NotificationsPage = () => {
  const { user } = useAuth();
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchConnectionRequests = async () => {
      try {
        const requests = await connectionApi.getConnectionRequests();
        setConnectionRequests(requests);
      } catch (error) {
        console.error('Error fetching connection requests:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchConnectionRequests();
      // Join user room for real-time notifications
      connectionApi.joinUserRoom(user.id || user._id);

      // Set up real-time listeners
      connectionApi.onConnectionRequest((data) => {
        console.log('New connection request received:', data);
        // Refresh connection requests
        fetchConnectionRequests();
      });

      connectionApi.onConnectionAccepted((data) => {
        console.log('Connection accepted:', data);
        // Could show a toast notification here
      });

      connectionApi.onConnectionRejected((data) => {
        console.log('Connection rejected:', data);
        // Could show a toast notification here
      });
    }

    // Cleanup function
    return () => {
      if (user) {
        connectionApi.leaveUserRoom(user.id || user._id);
        connectionApi.removeConnectionListeners();
      }
    };
  }, [user]);

  const handleAcceptConnection = async (connectionId) => {
    setProcessingId(connectionId);
    try {
      await connectionApi.acceptConnectionRequest(connectionId);
      // Remove from pending requests
      setConnectionRequests(prev => prev.filter(req => req._id !== connectionId));
    } catch (error) {
      console.error('Error accepting connection request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConnection = async (connectionId) => {
    setProcessingId(connectionId);
    try {
      await connectionApi.rejectConnectionRequest(connectionId);
      // Remove from pending requests
      setConnectionRequests(prev => prev.filter(req => req._id !== connectionId));
    } catch (error) {
      console.error('Error rejecting connection request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageCircle size={16} className="text-blue-600" />;
      case 'connection':
        return <UserPlus size={16} className="text-secondary-600" />;
      case 'investment':
        return <DollarSign size={16} className="text-accent-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  // Combine static notifications with dynamic connection requests
  const allNotifications = [
    ...connectionRequests.map(request => ({
      id: request._id,
      type: 'connection_request',
      user: {
        name: request.sender.name,
        avatar: request.sender.avatarUrl
      },
      content: 'sent you a connection request',
      time: new Date(request.createdAt).toLocaleString(),
      unread: true,
      connectionId: request._id
    })),
  ];

  if (loading) {
    return <div className="text-center py-12">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with your network activity</p>
        </div>

        <Button variant="outline" size="sm">
          Mark all as read
        </Button>
      </div>

      <div className="space-y-4">
        {allNotifications.map(notification => (
          <Card
            key={notification.id}
            className={`transition-colors duration-200 ${
              notification.unread ? 'bg-blue-50' : ''
            }`}
          >
            <CardBody className="flex items-start p-4">
              <Avatar
                src={notification.user.avatar}
                alt={notification.user.name}
                size="md"
                className="flex-shrink-0 mr-4"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {notification.user.name}
                  </span>
                  {notification.unread && (
                    <Badge variant="primary" size="sm" rounded>New</Badge>
                  )}
                </div>

                <p className="text-gray-600 mt-1">
                  {notification.content}
                </p>

                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  {getNotificationIcon(notification.type)}
                  <span>{notification.time}</span>
                </div>

                {notification.type === 'connection_request' && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptConnection(notification.connectionId)}
                      disabled={processingId === notification.connectionId}
                      leftIcon={<Check size={14} />}
                    >
                      {processingId === notification.connectionId ? 'Accepting...' : 'Accept'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectConnection(notification.connectionId)}
                      disabled={processingId === notification.connectionId}
                      leftIcon={<X size={14} />}
                    >
                      {processingId === notification.connectionId ? 'Rejecting...' : 'Reject'}
                    </Button>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};
