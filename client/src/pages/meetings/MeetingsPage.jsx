import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  updateMeetingStatus
} from '../../services/meetingApi';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  Building,
  Mail,
  User,
  Briefcase
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    accepted: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Accepted' },
    rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' },
    cancelled: { icon: XCircle, color: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} flex items-center gap-1`}>
      <Icon size={12} />
      {config.label}
    </Badge>
  );
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const MeetingsPage = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [viewingMeeting, setViewingMeeting] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null); // Track which meeting is being updated
  const [modalError, setModalError] = useState(null); // Error state for modal operations
  const [formData, setFormData] = useState({
    title: '',
    recipientEmail: '',
    startTime: '',
    endTime: '',
    meetingType: 'online',
    meetingLink: '',
    location: '',
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMeetings();
      setMeetings(data);
      console.log('Meetings fetched:', data);
    } catch (err) {
      setError(err.message || 'Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      setModalError(null);

      // Validate times
      const startTime = new Date(formData.startTime);
      const endTime = new Date(formData.endTime);

      if (startTime >= endTime) {
        setModalError('End time must be after start time');
        return;
      }

      const meetingData = {
        title: formData.title,
        recipientEmail: formData.recipientEmail,
        startTime: formData.startTime,
        endTime: formData.endTime,
        meetingType: formData.meetingType,
        meetingLink: formData.meetingType === 'online' ? formData.meetingLink : undefined,
        location: formData.meetingType === 'offline' ? formData.location : undefined,
      };

      const result = await createMeeting(meetingData);

      setShowModal(false);
      resetForm();
      fetchMeetings();
    } catch (err) {
      setModalError(err.message || 'Failed to create meeting');
    }
  };

  const handleUpdateMeeting = async (e) => {
    e.preventDefault();
    try {
      setModalError(null);

      // Validate times
      const startTime = new Date(formData.startTime);
      const endTime = new Date(formData.endTime);

      if (startTime >= endTime) {
        setModalError('End time must be after start time');
        return;
      }

      const updateData = {
        title: formData.title,
        startTime: formData.startTime,
        endTime: formData.endTime,
        meetingType: formData.meetingType,
        meetingLink: formData.meetingType === 'online' ? formData.meetingLink : undefined,
        location: formData.meetingType === 'offline' ? formData.location : undefined,
      };

      await updateMeeting(editingMeeting._id, updateData);
      setShowModal(false);
      setEditingMeeting(null);
      resetForm();
      fetchMeetings();
    } catch (err) {
      setModalError(err.message || 'Failed to update meeting');
    }
  };

  const handleStatusUpdate = async (meetingId, status) => {
    if (updatingStatus === meetingId) return; // Prevent multiple clicks

    try {
      setError(null);
      setUpdatingStatus(meetingId);
      console.log(`Updating meeting ${meetingId} to status: ${status}`);
      await updateMeetingStatus(meetingId, status);
      await fetchMeetings(); // Wait for fetch to complete
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      recipientEmail: '',
      startTime: '',
      endTime: '',
      meetingType: 'online',
      meetingLink: '',
      location: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingMeeting(null);
    setViewingMeeting(null);
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (meeting) => {
    setFormData({
      title: meeting.title,
      recipientEmail: meeting.recipientEmail,
      startTime: new Date(meeting.startTime).toISOString().slice(0, 16),
      endTime: new Date(meeting.endTime).toISOString().slice(0, 16),
      meetingType: meeting.meetingType,
      meetingLink: meeting.meetingLink || '',
      location: meeting.location || '',
    });
    setEditingMeeting(meeting);
    setViewingMeeting(null);
    setError(null);
    setShowModal(true);
  };

  const openViewModal = async (meeting) => {
    try {
      setError(null);
      const fullMeeting = await getMeetingById(meeting._id);
      console.log('Viewing meeting details:', fullMeeting);
      setViewingMeeting(fullMeeting);
      setShowModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch meeting details');
    }
  };

  if (!user) return null;

  // Helper function to compare IDs properly
  const compareIds = (id1, id2) => {
    if (!id1 || !id2) {
      console.log('Cannot compare IDs - one is missing:', { id1, id2 });
      return false;
    }
    
    // Handle different ID formats
    const str1 = typeof id1 === 'object' && id1._id ? id1._id.toString() : id1.toString();
    const str2 = typeof id2 === 'object' && id2._id ? id2._id.toString() : id2.toString();
    
    return str1 === str2;
  };

  // Determine if user is organizer or recipient for a meeting
  const isOrganizer = (meeting) => {
    if (!meeting || !meeting.organizer || !user || !user.id) {
      return false;
    }
    return compareIds(meeting.organizer, user.id);
  };

  const isRecipient = (meeting) => {
    if (!meeting || !meeting.recipient || !user || !user.id) {
      return false;
    }
    return compareIds(meeting.recipient, user.id);
  };

  // Get the other person in the meeting
  const getOtherPerson = (meeting) => {
    if (!meeting) return { name: '', email: '', type: '' };
    
    if (isOrganizer(meeting)) {
      return {
        name: meeting.recipientDetails?.name || meeting.recipientEmail || 'Unknown',
        email: meeting.recipientEmail || '',
        type: meeting.recipientType || '',
        isYou: false
      };
    } else {
      return {
        name: meeting.organizerDetails?.name || meeting.organizerEmail || 'Unknown',
        email: meeting.organizerEmail || '',
        type: meeting.organizerType || '',
        isYou: false
      };
    }
  };

  // Safe ID comparison for modal
  const isViewingMeetingOrganizer = () => {
    if (!viewingMeeting || !viewingMeeting.organizer || !user || !user.id) {
      return false;
    }
    return compareIds(viewingMeeting.organizer, user.id);
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto animate-fade-in">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
            <p className="text-gray-600 mt-1">Schedule and manage 1:1 meetings</p>
          </div>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus size={16} />
            Schedule Meeting
          </Button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings yet</h3>
            <p className="text-gray-600 mb-4">Schedule your first meeting to get started</p>
            <Button onClick={openCreateModal}>Schedule Meeting</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {meetings.map((meeting) => {
              const organizer = isOrganizer(meeting);
              const recipient = isRecipient(meeting);
              const otherPerson = getOtherPerson(meeting);
              
              return (
                <Card key={meeting._id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                        <StatusBadge status={meeting.status} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>{formatDateTime(meeting.startTime)} - {formatDateTime(meeting.endTime)}</span>
                        </div>

                        {meeting.meetingType === 'online' ? (
                          <div className="flex items-center gap-2">
                            <Video size={16} />
                            <span>Online Meeting</span>
                            {meeting.meetingLink && (
                              <a 
                                href={meeting.meetingLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-xs"
                              >
                                Join
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Building size={16} />
                            <span>{meeting.location || 'Location TBD'}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {otherPerson.type === 'Entrepreneur' ? (
                            <User size={16} className="text-blue-600" />
                          ) : (
                            <Briefcase size={16} className="text-green-600" />
                          )}
                          <span>
                            {organizer ? 'With: ' : 'From: '}
                            <span className="font-medium">{otherPerson.name}</span>
                            <span className="text-gray-500 ml-2">({otherPerson.type})</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Mail size={16} />
                          <span className={organizer ? 'text-green-600' : 'text-blue-600'}>
                            {organizer ? 'You scheduled this meeting' : 'You are invited to this meeting'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewModal(meeting)}
                        className="flex items-center gap-1"
                      >
                        <Eye size={14} />
                        View
                      </Button>
                      {organizer && (meeting.status === 'pending' || meeting.status === 'accepted') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(meeting)}
                          className="flex items-center gap-1"
                        >
                          <Edit size={14} />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Show accept/reject buttons only for recipient when meeting is pending */}
                  {recipient && meeting.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(meeting._id, 'accepted')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle size={14} className="mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(meeting._id, 'rejected')}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <XCircle size={14} className="mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {/* Show cancel button for organizer when meeting is pending or accepted */}
                  {organizer && (meeting.status === 'pending' || meeting.status === 'accepted') && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(meeting._id, 'cancelled')}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        Cancel Meeting
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {viewingMeeting ? 'Meeting Details' : editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingMeeting(null);
                    setViewingMeeting(null);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {viewingMeeting ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <p className="text-gray-900">{viewingMeeting.title}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <p className="text-gray-900">{formatDateTime(viewingMeeting.startTime)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <p className="text-gray-900">{formatDateTime(viewingMeeting.endTime)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <StatusBadge status={viewingMeeting.status} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type</label>
                    <p className="text-gray-900 capitalize">{viewingMeeting.meetingType}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isViewingMeetingOrganizer() ? 'With' : 'From'}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {isViewingMeetingOrganizer() ? (
                        <>
                          {viewingMeeting.recipientType === 'Entrepreneur' ? (
                            <User size={16} className="text-blue-600" />
                          ) : (
                            <Briefcase size={16} className="text-green-600" />
                          )}
                          <p className="text-gray-900">
                            {viewingMeeting.recipientDetails?.name || viewingMeeting.recipientEmail || 'Unknown'}
                            {viewingMeeting.recipientType && (
                              <span className="text-gray-500 ml-2">({viewingMeeting.recipientType})</span>
                            )}
                          </p>
                        </>
                      ) : (
                        <>
                          {viewingMeeting.organizerType === 'Entrepreneur' ? (
                            <User size={16} className="text-blue-600" />
                          ) : (
                            <Briefcase size={16} className="text-green-600" />
                          )}
                          <p className="text-gray-900">
                            {viewingMeeting.organizerDetails?.name || viewingMeeting.organizerEmail || 'Unknown'}
                            {viewingMeeting.organizerType && (
                              <span className="text-gray-500 ml-2">({viewingMeeting.organizerType})</span>
                            )}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {viewingMeeting.meetingType === 'online' && viewingMeeting.meetingLink && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                      <a href={viewingMeeting.meetingLink} target="_blank" rel="noopener noreferrer"
                         className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1">
                        <Video size={14} />
                        {viewingMeeting.meetingLink}
                      </a>
                    </div>
                  )}

                  {viewingMeeting.meetingType === 'offline' && viewingMeeting.location && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <p className="text-gray-900 flex items-center gap-1">
                        <Building size={14} />
                        {viewingMeeting.location}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={editingMeeting ? handleUpdateMeeting : handleCreateMeeting} className="space-y-4">
                  {modalError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-800">{modalError}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title *</label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                      placeholder="Enter meeting title"
                    />
                  </div>

                  {!editingMeeting && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {user.role === 'entrepreneur' ? 'Investor Email *' : 'Entrepreneur Email *'}
                      </label>
                      <Input
                        type="email"
                        value={formData.recipientEmail}
                        onChange={(e) => setFormData({...formData, recipientEmail: e.target.value})}
                        required
                        placeholder={user.role === 'entrepreneur' 
                          ? 'Enter investor email' 
                          : 'Enter entrepreneur email'}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {user.role === 'entrepreneur' 
                          ? 'Enter the email of the investor you want to meet with'
                          : 'Enter the email of the entrepreneur you want to meet with'}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                      <Input
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                        required
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                      <Input
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                        required
                        min={formData.startTime || new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type</label>
                    <select
                      value={formData.meetingType}
                      onChange={(e) => setFormData({...formData, meetingType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>

                  {formData.meetingType === 'online' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (Optional)</label>
                      <Input
                        type="url"
                        value={formData.meetingLink}
                        onChange={(e) => setFormData({...formData, meetingLink: e.target.value})}
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location (Optional)</label>
                      <Input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="Meeting location"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowModal(false);
                        setEditingMeeting(null);
                        setViewingMeeting(null);
                        setError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};