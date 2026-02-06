const express = require('express');
const auth = require('../middleware/auth');
const { createMeeting, getMeetings, getMeetingById, updateMeeting, deleteMeeting, updateMeetingStatus } = require('../services/meetingService');

const router = express.Router();

// Create a new meeting
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating meeting - User:', req.user.email);
    const meeting = await createMeeting(req.body, req.user);
    res.status(201).json({ message: 'Meeting created successfully', meeting });
  } catch (error) {
    console.error('Create meeting error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Get all meetings for the user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Getting meetings for user:', req.user.email);
    const meetings = await getMeetings(req.user);
    res.json(meetings);
  } catch (error) {
    console.error('Get meetings error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Get a specific meeting by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const meeting = await getMeetingById(req.params.id, req.user);
    res.json(meeting);
  } catch (error) {
    console.error('Get meeting by ID error:', error.message);
    res.status(404).json({ message: error.message });
  }
});

// Update a meeting
router.put('/:id', auth, async (req, res) => {
  try {
    const meeting = await updateMeeting(req.params.id, req.body, req.user);
    res.json({ message: 'Meeting updated successfully', meeting });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a meeting
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await deleteMeeting(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    console.error('Delete meeting error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Update meeting status (accept/reject)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      console.error('Invalid status:', status);
      return res.status(400).json({ message: 'Status must be "accepted", "rejected", or "cancelled"' });
    }
    
    const meeting = await updateMeetingStatus(req.params.id, status, req.user);
    res.json({ message: `Meeting ${status} successfully`, meeting });
  } catch (error) {
    console.error('Update status error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;