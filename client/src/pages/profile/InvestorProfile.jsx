import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Building2, MapPin, UserCircle, BarChart3, Briefcase, Edit, Save, X, CheckCircle, AlertCircle, UserPlus, UserCheck, Clock } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { fetchUserById } from '../../services/userApi';
import { connectionApi } from '../../services/connectionApi';

export const InvestorProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [investor, setInvestor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [connectedStartupsCount, setConnectedStartupsCount] = useState(0);

  useEffect(() => {
    const fetchInvestor = async () => {
      if (!id) return;
      try {
        const data = await fetchUserById(id, "investor");
        setInvestor(data);
        setFormData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchConnectionStatus = async () => {
      if (!id || !currentUser) return;
      try {
        const status = await connectionApi.getConnectionStatus(id);
        setConnectionStatus(status);
      } catch (err) {
        console.error('Error fetching connection status:', err);
      }
    };

    const fetchConnectedStartupsCount = async () => {
      if (!id) return;
      try {
        const response = await fetch(`${import.meta.env.API_BASE_URL}/connections/connected-startups/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        const data = await response.json();
        setConnectedStartupsCount(data.count);
      } catch (err) {
        console.error('Error fetching connected startups count:', err);
      }
    };

    fetchInvestor();
    fetchConnectionStatus();
    fetchConnectedStartupsCount();
  }, [id, currentUser]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (sectionId = null) => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      let updates = {};

      if (sectionId) {
        // Find the section to get its fields
        const section = sections.find(s => s.id === sectionId);
        if (section) {
          section.fields.forEach(field => {
            if (formData[field] !== undefined) {
              updates[field] = formData[field];
            }
          });
        }
      } else {
        // Full save - send all formData
        updates = { ...formData };
      }

      const response = await fetch(`${import.meta.env.API_BASE_URL}/profile/update-investor-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ updates })
      });

      const result = await response.json()

      if (response.ok) {
        setInvestor(result.updatedProfile);
        setFormData(result.updatedProfile);
        setActiveSection(null);
        setSaveSuccess(true);

        // Hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        console.error('Save failed with message:', result.message);
        setError(result.message || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Save failed with error:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSendConnectionRequest = async () => {
    if (!investor || sendingRequest) return;

    setSendingRequest(true);
    try {
      await connectionApi.sendConnectionRequest(investor.id || investor._id);
      setConnectionStatus('pending');
    } catch (err) {
      console.error('Error sending connection request:', err);
      setError('Failed to send connection request');
    } finally {
      setSendingRequest(false);
    }
  };

  const sections = [
    { id: 'basic', title: 'Basic Info', fields: ['name', 'bio'] },
    { id: 'investment', title: 'Investment Preferences', fields: ['investmentFocus', 'ticketSize', 'industries', 'investmentInterests', 'investmentStage', 'minimumInvestment', 'maximumInvestment'] },
    { id: 'portfolio', title: 'Portfolio & Links', fields: ['portfolioCompanies', 'portfolioLinks', 'totalInvestments'] }
  ];

  if (loading) {
    return <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Loading...</h2></div>;
  }

  if (error && !investor) {
    return <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Error</h2><p className="text-gray-600 mt-2">{error}</p></div>;
  }

  if (!investor) {
    return <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Investor not found</h2></div>;
  }

  const isCurrentUser = currentUser?.id === investor.id || currentUser?._id === investor.id;
  const isEntrepreneur = currentUser?.role === 'entrepreneur';

  if (isEditing && !isEntrepreneur) {
    return (
      <div className="space-y-6">
        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <CheckCircle className="text-green-500 mr-2" size={20} />
              <p className="text-green-800 font-medium">Profile saved successfully!</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-2" size={20} />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Edit Investor Profile</h1>
          <div className="flex gap-2">
            <Button onClick={() => handleSave()} disabled={saving} leftIcon={<Save size={18} />}>
              {saving ? 'Saving...' : 'Save All'}
            </Button>
            <Button onClick={() => setIsEditing(false)} variant="outline" leftIcon={<X size={18} />}>
              Cancel
            </Button>
          </div>
        </div>

        {sections.map(section => (
          <Card key={section.id}>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">{section.title}</h2>
              <div className="flex gap-2">
                {activeSection === section.id ? (
                  <>
                    <Button size="sm" onClick={() => handleSave(section.id)} disabled={saving} leftIcon={<Save size={16} />}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setActiveSection(null)} leftIcon={<X size={16} />}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setActiveSection(section.id)} leftIcon={<Edit size={16} />}>
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {activeSection === section.id ? (
                <div className="space-y-4">
                  {section.fields.map(field => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      {field === 'bio' ? (
                        <textarea
                          value={formData[field] || ''}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                          placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').trim()}`}
                          rows={3}
                        />
                      ) : (
                        <Input
                          value={Array.isArray(formData[field]) ? formData[field].join(', ') : formData[field] || ''}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                          placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').trim()}`}
                        />
                      )}
                      {field === 'industries' || field === 'investmentInterests' || field === 'investmentStage' ? (
                        <p className="text-xs text-gray-500 mt-1">Separate multiple values with commas</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {section.fields.map(field => (
                    <div key={field} className="flex justify-between items-start">
                      <span className="text-sm text-gray-500 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="text-sm text-gray-900 text-right max-w-xs">
                        {Array.isArray(formData[field])
                          ? formData[field].join(', ')
                          : (formData[field] || <span className="text-gray-400 italic">Not set</span>)
                        }
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="text-green-500 mr-2" size={20} />
            <p className="text-green-800 font-medium">Profile saved successfully!</p>
          </div>
        </div>
      )}

      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={investor.avatarUrl}
              alt={investor.name}
              size="xl"
              status={investor.isOnline ? 'online' : 'offline'}
              className="mx-auto sm:mx-0"
            />

            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{investor.name || 'Unnamed Investor'}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Investor • {investor.totalInvestments || 0} investments
              </p>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {investor.location && (
                  <Badge variant="primary">
                    <MapPin size={14} className="mr-1" />
                    {investor.location}
                  </Badge>
                )}
                {investor.investmentStage && Array.isArray(investor.investmentStage) && investor.investmentStage.map((stage, index) => (
                  <Badge key={index} variant="secondary" size="sm">{stage}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {isEntrepreneur && (
              <>
                <Link to={`/chat/${investor.id || investor._id}`}>
                  <Button leftIcon={<MessageCircle size={18} />}>
                    Message
                  </Button>
                </Link>
                {/* {isEntrepreneur && ( */}
                  <Button
                    variant={connectionStatus === 'accepted' ? 'primary' : connectionStatus === 'pending' ? 'outline' : 'primary'}
                    leftIcon={
                      connectionStatus === 'accepted' ? <UserCheck size={18} /> :
                      connectionStatus === 'pending' ? <Clock size={18} /> :
                      <UserPlus size={18} />
                    }
                    onClick={handleSendConnectionRequest}
                    disabled={sendingRequest || connectionStatus === 'accepted' || connectionStatus === 'pending'}
                  >
                    {sendingRequest ? 'Sending...' :
                     connectionStatus === 'accepted' ? 'Connected' :
                     connectionStatus === 'pending' ? 'Request Sent' :
                     'Connect'}
                  </Button>
                {/* )} */}
              </>
            )}

            {!isEntrepreneur && (
              <Button
                variant="outline"
                leftIcon={<Edit size={18} />}
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {investor.bio && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">About</h2>
              </CardHeader>
              <CardBody>
                <p className="text-gray-700">{investor.bio}</p>
              </CardBody>
            </Card>
          )}

          {(investor.investmentInterests || investor.investmentStage || investor.industries) && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Investment Interests</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {investor.industries && Array.isArray(investor.industries) && investor.industries.length > 0 && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900">Industries</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {investor.industries.map((industry, index) => (
                          <Badge key={index} variant="primary" size="md">{industry}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {investor.investmentInterests && Array.isArray(investor.investmentInterests) && investor.investmentInterests.length > 0 && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900">Investment Interests</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {investor.investmentInterests.map((interest, index) => (
                          <Badge key={index} variant="accent" size="md">{interest}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {investor.investmentStage && Array.isArray(investor.investmentStage) && investor.investmentStage.length > 0 && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900">Investment Stages</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {investor.investmentStage.map((stage, index) => (
                          <Badge key={index} variant="secondary" size="md">{stage}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {investor.portfolioCompanies && Array.isArray(investor.portfolioCompanies) && investor.portfolioCompanies.length > 0 && (
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Portfolio Companies</h2>
                <span className="text-sm text-gray-500">{investor.portfolioCompanies.length} companies</span>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {investor.portfolioCompanies.map((company, index) => (
                    <div key={index} className="flex items-center p-3 border border-gray-200 rounded-md">
                      <div className="p-3 bg-blue-50 rounded-md mr-3">
                        <Briefcase size={18} className="text-blue-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{company}</h3>
                        <p className="text-xs text-gray-500">Portfolio Company</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {(investor.minimumInvestment || investor.maximumInvestment || investor.totalInvestments || investor.ticketSize || investor.investmentFocus) && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Investment Details</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {(investor.minimumInvestment || investor.maximumInvestment) && (
                    <div>
                      <span className="text-sm text-gray-500">Investment Range</span>
                      <p className="text-lg font-semibold text-gray-900">
                        {investor.minimumInvestment || 'N/A'} - {investor.maximumInvestment || 'N/A'}
                      </p>
                    </div>
                  )}

                  {investor.totalInvestments && (
                    <div>
                      <span className="text-sm text-gray-500">Total Investments</span>
                      <p className="text-md font-medium text-gray-900">{investor.totalInvestments} companies</p>
                    </div>
                  )}

                  {investor.ticketSize && (
                    <div>
                      <span className="text-sm text-gray-500">Typical Ticket Size</span>
                      <p className="text-md font-medium text-gray-900">{investor.ticketSize}</p>
                    </div>
                  )}

                  {investor.investmentFocus && (
                    <div>
                      <span className="text-sm text-gray-500">Investment Focus</span>
                      <p className="text-md font-medium text-gray-900">{investor.investmentFocus}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Investment Stats</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Total Investments</h3>
                      <p className="text-xl font-semibold text-blue-700 mt-1">{investor.totalInvestments || 0}</p>
                    </div>
                    <BarChart3 size={24} className="text-blue-600" />
                  </div>
                </div>

                <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Active Investments</h3>
                      <p className="text-xl font-semibold text-blue-700 mt-1">
                        {investor.portfolioCompanies && Array.isArray(investor.portfolioCompanies)
                          ? investor.portfolioCompanies.length
                          : 0}
                      </p>
                    </div>
                    <BarChart3 size={24} className="text-blue-600" />
                  </div>
                </div>

                <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Connected Startups</h3>
                      <p className="text-xl font-semibold text-blue-700 mt-1">{connectedStartupsCount}</p>
                    </div>
                    <UserCheck size={24} className="text-blue-600" />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};