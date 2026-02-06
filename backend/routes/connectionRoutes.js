const express = require('express');
const router = express.Router();
const connectionService = require('../services/connectionService');
const auth = require('../middleware/auth');

// Send connection request (entrepreneur to investor)
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    // Check if user is entrepreneur
    if (req.user.role !== 'entrepreneur') {
      return res.status(403).json({ message: 'Only entrepreneurs can send connection requests' });
    }

    const connection = await connectionService.sendConnectionRequest(senderId, receiverId);

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('connection_request', {
        connection,
        message: 'New connection request received'
      });
    }

    res.status(201).json({
      message: 'Connection request sent successfully',
      connection
    });
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(400).json({ message: error.message });
  }
});

// Accept connection request
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const connectionId = req.params.id;
    const receiverId = req.user.id;

    const connection = await connectionService.acceptConnectionRequest(connectionId, receiverId);

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${connection.sender._id}`).emit('connection_accepted', {
        connection,
        message: 'Your connection request was accepted'
      });
    }

    res.json({
      message: 'Connection request accepted',
      connection
    });
  } catch (error) {
    console.error('Error accepting connection request:', error);
    res.status(400).json({ message: error.message });
  }
});

// Reject connection request
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const connectionId = req.params.id;
    const receiverId = req.user.id;

    const connection = await connectionService.rejectConnectionRequest(connectionId, receiverId);

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${connection.sender._id}`).emit('connection_rejected', {
        connection,
        message: 'Your connection request was rejected'
      });
    }

    res.json({
      message: 'Connection request rejected',
      connection
    });
  } catch (error) {
    console.error('Error rejecting connection request:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get connection requests for current user
router.get('/requests', auth, async (req, res) => {
  try {
    const connections = await connectionService.getConnectionRequests(req.user.id);
    res.json(connections);
  } catch (error) {
    console.error('Error fetching connection requests:', error);
    res.status(500).json({ message: 'Failed to fetch connection requests' });
  }
});

// Get connections for current user
router.get('/', auth, async (req, res) => {
  try {
    const connections = await connectionService.getConnections(req.user.id);
    res.json(connections);
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ message: 'Failed to fetch connections' });
  }
});

// Get connection status between two users
router.get('/status/:userId', auth, async (req, res) => {
  try {
    const status = await connectionService.getConnectionStatus(req.user.id, req.params.userId);
    res.json({ status });
  } catch (error) {
    console.error('Error fetching connection status:', error);
    res.status(500).json({ message: 'Failed to fetch connection status' });
  }
});

// Get sent requests for current user
router.get('/sent', auth, async (req, res) => {
  try {
    const connections = await connectionService.getSentRequests(req.user.id);
    res.json(connections);
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    res.status(500).json({ message: 'Failed to fetch sent requests' });
  }
});

// Get count of connected startups for an investor
router.get('/connected-startups/:investorId', auth, async (req, res) => {
  try {
    const investorId = req.params.investorId;
    const count = await connectionService.getConnectedStartupsCount(investorId);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching connected startups count:', error);
    res.status(500).json({ message: 'Failed to fetch connected startups count' });
  }
});

module.exports = router;
