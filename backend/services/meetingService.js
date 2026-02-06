const Meeting = require('../models/Meetings');
const Entrepreneur = require('../models/Entrepreneur');
const Investor = require('../models/Investor');

const createMeeting = async (meetingData, user) => {
  try {
    console.log('Creating meeting with data:', meetingData);
    console.log('User:', user.email, 'Type:', user.role === 'entrepreneur' ? 'Entrepreneur' : 'Investor');
    
    // Validation
    if (!meetingData.title || !meetingData.startTime || !meetingData.endTime || !meetingData.recipientEmail) {
      throw new Error('Title, start time, end time, and recipient email are required');
    }

    // Validate time
    const startTime = new Date(meetingData.startTime);
    const endTime = new Date(meetingData.endTime);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error('Invalid date format');
    }
    
    if (startTime >= endTime) {
      throw new Error('End time must be after start time');
    }

    // Determine organizer info
    const organizerId = user._id;
    const organizerType = user.role === 'entrepreneur' ? 'Entrepreneur' : 'Investor';
    const organizerEmail = user.email;

    // Find recipient
    console.log('Looking up recipient:', meetingData.recipientEmail);
    
    let recipient = null;
    let recipientType = null;
    
    // If organizer is Entrepreneur, recipient should be Investor
    if (organizerType === 'Entrepreneur') {
      recipient = await Investor.findOne({ email: meetingData.recipientEmail });
      recipientType = 'Investor';
    } 
    // If organizer is Investor, recipient should be Entrepreneur
    else if (organizerType === 'Investor') {
      recipient = await Entrepreneur.findOne({ email: meetingData.recipientEmail });
      recipientType = 'Entrepreneur';
    }
    
    if (!recipient) {
      throw new Error(`${recipientType} with email ${meetingData.recipientEmail} not found`);
    }

    // Check if recipient is the same as organizer
    if (recipient._id.toString() === organizerId.toString()) {
      throw new Error('Cannot schedule a meeting with yourself');
    }

    // Check for overlapping meetings (optional but good to have)
    const overlappingMeetings = await Meeting.find({
      $or: [
        { organizer: organizerId },
        { recipient: organizerId },
        { organizer: recipient._id },
        { recipient: recipient._id }
      ],
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } },
        { status: { $in: ['pending', 'accepted'] } }
      ]
    });

    if (overlappingMeetings.length > 0) {
      throw new Error('There is a scheduling conflict with an existing meeting');
    }

    const meeting = new Meeting({
      title: meetingData.title,
      organizer: organizerId,
      organizerType,
      organizerEmail,
      recipient: recipient._id,
      recipientType,
      recipientEmail: recipient.email,
      startTime: startTime,
      endTime: endTime,
      status: "pending",
      meetingType: meetingData.meetingType || "online",
      meetingLink: meetingData.meetingType === "online" ? meetingData.meetingLink : undefined,
      location: meetingData.meetingType === "offline" ? meetingData.location : undefined,
    });

    await meeting.save();
    console.log('Meeting saved successfully:', meeting._id);
    
    // Populate recipient info before returning
    const populatedMeeting = meeting.toObject();
    if (recipientType === 'Entrepreneur') {
      populatedMeeting.recipientDetails = await Entrepreneur.findById(recipient._id)
        .select('name email profileImage companyName');
    } else {
      populatedMeeting.recipientDetails = await Investor.findById(recipient._id)
        .select('name email profileImage investmentFocus company');
    }
    
    return populatedMeeting;
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
};

const getMeetings = async (user) => {
  try {
    console.log('Getting meetings for user:', user._id, user.email);
    
    const meetings = await Meeting.find({
      $or: [
        { organizer: user._id },
        { recipient: user._id }
      ]
    })
    .sort({ startTime: 1 });
    
    // Populate meeting details
    const populatedMeetings = await Promise.all(meetings.map(async (meeting) => {
      const meetingObj = meeting.toObject();
      
      // Populate organizer details
      if (meeting.organizerType === "Entrepreneur") {
        meetingObj.organizerDetails = await Entrepreneur.findById(meeting.organizer)
          .select('name email profileImage companyName');
      } else {
        meetingObj.organizerDetails = await Investor.findById(meeting.organizer)
          .select('name email profileImage investmentFocus company');
      }
      
      // Populate recipient details
      if (meeting.recipientType === "Entrepreneur") {
        meetingObj.recipientDetails = await Entrepreneur.findById(meeting.recipient)
          .select('name email profileImage companyName');
      } else {
        meetingObj.recipientDetails = await Investor.findById(meeting.recipient)
          .select('name email profileImage investmentFocus company');
      }
      
      return meetingObj;
    }));
    
    console.log(`Found ${populatedMeetings.length} meetings`);
    return populatedMeetings;
  } catch (error) {
    console.error('Error getting meetings:', error);
    throw error;
  }
};

const getMeetingById = async (meetingId, user) => {
  try {
    console.log('Getting meeting by ID:', meetingId, 'for user:', user._id);
    
    const meeting = await Meeting.findById(meetingId);
    
    if (!meeting) {
      throw new Error('Meeting not found');
    }
    
    // Check authorization
    const isOrganizer = meeting.organizer.toString() === user._id.toString();
    const isRecipient = meeting.recipient.toString() === user._id.toString();
    
    if (!isOrganizer && !isRecipient) {
      throw new Error('Unauthorized');
    }
    
    // Populate meeting data
    const meetingObj = meeting.toObject();
    
    // Populate organizer details
    if (meeting.organizerType === "Entrepreneur") {
      meetingObj.organizerDetails = await Entrepreneur.findById(meeting.organizer)
        .select('name email profileImage companyName bio');
    } else {
      meetingObj.organizerDetails = await Investor.findById(meeting.organizer)
        .select('name email profileImage investmentFocus bio company');
    }
    
    // Populate recipient details
    if (meeting.recipientType === "Entrepreneur") {
      meetingObj.recipientDetails = await Entrepreneur.findById(meeting.recipient)
        .select('name email profileImage companyName bio');
    } else {
      meetingObj.recipientDetails = await Investor.findById(meeting.recipient)
        .select('name email profileImage investmentFocus bio company');
    }
    
    return meetingObj;
  } catch (error) {
    console.error('Error getting meeting by ID:', error);
    throw error;
  }
};

const updateMeeting = async (meetingId, updateData, user) => {
  try {
    console.log('Updating meeting:', meetingId, 'by user:', user._id);
    
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }
    
    // Check if user is organizer (only organizer can update meeting details)
    if (meeting.organizer.toString() !== user._id.toString()) {
      throw new Error('Unauthorized: Only organizer can update meeting details');
    }
    
    // Update meeting
    Object.keys(updateData).forEach(key => {
      if (key !== "_id" && key !== "__v" && key !== "organizer" && key !== "recipient") {
        meeting[key] = updateData[key];
      }
    });
    
    await meeting.save();
    return meeting;
  } catch (error) {
    console.error('Error updating meeting:', error);
    throw error;
  }
};

const deleteMeeting = async (meetingId, user) => {
  try {
    console.log('Deleting meeting:', meetingId, 'by user:', user._id);
    
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }
    
    // Check if user is organizer (only organizer can delete meeting)
    if (meeting.organizer.toString() !== user._id.toString()) {
      throw new Error('Unauthorized: Only organizer can delete meeting');
    }
    
    await Meeting.findByIdAndDelete(meetingId);
    return { message: 'Meeting deleted successfully' };
  } catch (error) {
    console.error('Error deleting meeting:', error);
    throw error;
  }
};

const updateMeetingStatus = async (meetingId, status, user) => {
  try {
    console.log('Updating meeting status:', meetingId, 'to:', status, 'by user:', user._id);
    
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }
    
    // Check if user is recipient (only recipient can accept/reject)
    if (status != "cancelled"  && meeting.recipient.toString() !== user._id.toString()) {
      throw new Error('Unauthorized: Only the meeting recipient can accept or reject');
    }
    
    // Update meeting status
    meeting.status = status;
    
    await meeting.save();
    return meeting;
  } catch (error) {
    console.error('Error updating meeting status:', error);
    throw error;
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  updateMeetingStatus
};