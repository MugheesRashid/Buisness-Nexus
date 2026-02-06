import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Users, Calendar, Building2, MapPin, UserCircle, FileText, DollarSign, Send, Edit, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { fetchUserById } from '../../services/userApi';

export const EntrepreneurProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [entrepreneur, setEntrepreneur] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    const fetchEntrepreneur = async () => {
      if (!id) return;
      try {
        const data = await fetchUserById(id, 'entrepreneur');
        console.log('Fetched entrepreneur data:', data);
        setEntrepreneur(data);
        setFormData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEntrepreneur();
  }, [id]);

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
      
      console.log('Saving updates:', updates);
      console.log('User ID:', user?.id);
      
      const response = await fetch(`${import.meta.env.API_BASE_URL}/profile/update-entrepreneur-profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${localStorage.getItem('authToken')}` 
        },
        body: JSON.stringify({ updates })
      });
      
      console.log("Save response status:", response.status);
      
      const result = await response.json();
      console.log("Save result:", result);
      
      if (response.ok) {
        setEntrepreneur(result.updatedProfile);
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

  const sections = [
    { id: 'basic', title: 'Basic Info', fields: ['name', 'bio'] },
    { id: 'startup', title: 'Startup Basics', fields: ['startupName', 'tagline', 'industry', 'location', 'foundedYear', 'teamSize'] },
    { id: 'pitch', title: 'Pitch & Summary', fields: ['summary', 'pitch'] },
    { id: 'funding', title: 'Funding Details', fields: ['stage', 'fundingNeeded'] },
    { id: 'media', title: 'Media & Links', fields: ['website', 'pitchDeckUrl', 'socialLinks'] }
  ];

  const completionProgress = entrepreneur ? (
    (entrepreneur.startupName && entrepreneur.summary && entrepreneur.pitch ? 100 : 
     (entrepreneur.startupName || entrepreneur.summary || entrepreneur.pitch ? 50 : 25))
  ) : 0;

  if (loading) {
    return <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Loading...</h2></div>;
  }

  if (error && !entrepreneur) {
    return <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Error</h2><p className="text-gray-600 mt-2">{error}</p></div>;
  }

  if (!entrepreneur) {
    return <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Entrepreneur not found</h2></div>;
  }

  const isCurrentUser = user?.id === entrepreneur.id || user?._id === entrepreneur.id;
  const isInvestor = user?.role === 'investor';

  if (isEditing && !isInvestor) {
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <div className="flex gap-2">
            <Button onClick={() => handleSave()} disabled={saving} leftIcon={<Save size={18} />}>
              {saving ? 'Saving...' : 'Save All'}
            </Button>
            <Button onClick={() => setIsEditing(false)} variant="outline" leftIcon={<X size={18} />}>
              Cancel
            </Button>
          </div>
        </div>

        <Card>
          <CardBody>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Profile Completion</span>
                <span className="text-sm text-gray-500">{completionProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${completionProgress}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {completionProgress < 100 
                  ? 'Complete your profile to make it visible to investors' 
                  : 'Your profile is complete and visible to investors'}
              </p>
            </div>
          </CardBody>
        </Card>

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
                      {(field === 'bio' || field === 'summary' || field === 'pitch') ? (
                        <textarea
                          value={formData[field] || ''}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                          placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').trim()}`}
                          rows={field === 'pitch' ? 6 : 3}
                        />
                      ) : field === 'industry' ? (
                        <Input
                          value={Array.isArray(formData[field]) ? formData[field].join(', ') : formData[field] || ''}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                          placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').trim()}`}
                        />
                      ) : (
                        <Input
                          value={formData[field] || ''}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                          placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').trim()}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {section.fields.map(field => (
                    <div key={field} className="flex justify-between items-start">
                      <span className="text-sm text-gray-500 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="text-sm text-gray-900 text-right max-w-xs">
                        {formData[field] || <span className="text-gray-400 italic">Not set</span>}
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
      {entrepreneur.startupName && (
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar 
              src={entrepreneur.avatarUrl} 
              alt={entrepreneur.name} 
              size="xl" 
              status={entrepreneur.isOnline ? 'online' : 'offline'} 
              className="mx-auto sm:mx-0" 
            />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{entrepreneur.name || 'Unnamed Entrepreneur'}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Founder at {entrepreneur.startupName || 'Startup'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {entrepreneur.industry && Array.isArray(entrepreneur.industry) && entrepreneur.industry.map((industry, index) => (
                  <Badge key={index} variant="primary">{industry}</Badge>
                ))}
                {entrepreneur.location && <Badge variant="gray"><MapPin size={14} className="mr-1" />{entrepreneur.location}</Badge>}
                {entrepreneur.foundedYear && <Badge variant="accent"><Calendar size={14} className="mr-1" />Founded {entrepreneur.foundedYear}</Badge>}
                {entrepreneur.teamSize && <Badge variant="secondary"><Users size={14} className="mr-1" />{entrepreneur.teamSize} team members</Badge>}
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <>
                <Link to={`/chat/${entrepreneur.id || entrepreneur._id}`}>
                  <Button variant="outline" leftIcon={<MessageCircle size={18} />}>Message</Button>
                </Link>
                {isInvestor && <Button leftIcon={<Send size={18} />}>Request Collaboration</Button>}
              </>
            )}
            {isCurrentUser && (
              <Button onClick={() => setIsEditing(true)} variant="outline" leftIcon={<Edit size={18} />}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
      )}

      {entrepreneur && !isInvestor &&(
        <Card className="border-yellow-200 bg-yellow-50">
          <CardBody className="flex items-center gap-3">
            <AlertCircle className="text-yellow-600" size={24} />
            <div>
              <h3 className="font-medium text-yellow-800">Complete Your Profile</h3>
              <p className="text-yellow-700">Add startup name, summary, and pitch to make your profile public.</p>
            </div>
            <Button onClick={() => setIsEditing(true)} className="ml-auto">Complete Now</Button>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {entrepreneur.bio && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">About</h2></CardHeader>
              <CardBody><p className="text-gray-700">{entrepreneur.bio}</p></CardBody>
            </Card>
          )}
          {entrepreneur.summary && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Startup Overview</h2></CardHeader>
              <CardBody><p className="text-gray-700">{entrepreneur.summary}</p></CardBody>
            </Card>
          )}
          {entrepreneur.pitch && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Pitch</h2></CardHeader>
              <CardBody><p className="text-gray-700 whitespace-pre-line">{entrepreneur.pitch}</p></CardBody>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          {(entrepreneur.stage || entrepreneur.fundingNeeded) && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Funding</h2></CardHeader>
              <CardBody className="space-y-3">
                {entrepreneur.stage && (
                  <div>
                    <span className="text-sm text-gray-500">Stage:</span>
                    <p className="text-gray-900 font-medium">{entrepreneur.stage}</p>
                  </div>
                )}
                {entrepreneur.fundingNeeded && (
                  <div>
                    <span className="text-sm text-gray-500">Funding Needed:</span>
                    <p className="text-gray-900 font-medium">{entrepreneur.fundingNeeded}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
          
          {(entrepreneur.website || entrepreneur.pitchDeckUrl || entrepreneur.socialLinks) && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Links</h2></CardHeader>
              <CardBody className="space-y-2">
                {entrepreneur.website && (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">Website:</span>
                    <a href={entrepreneur.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {entrepreneur.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {entrepreneur.pitchDeckUrl && (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">Pitch Deck:</span>
                    <a href={entrepreneur.pitchDeckUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      View Pitch Deck
                    </a>
                  </div>
                )}
                {entrepreneur.socialLinks && (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">Social:</span>
                    <span className="text-gray-900">{entrepreneur.socialLinks}</span>
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