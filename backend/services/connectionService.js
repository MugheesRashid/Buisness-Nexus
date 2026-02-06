const Connection = require('../models/Connection');
const Entrepreneur = require('../models/Entrepreneur');
const Investor = require('../models/Investor');

class ConnectionService {
  // Send connection request from entrepreneur to investor
  async sendConnectionRequest(senderId, receiverId) {
    // Check if sender is entrepreneur and receiver is investor
    const sender = await Entrepreneur.findById(senderId);
    const receiver = await Investor.findById(receiverId);

    if (!sender) {
      throw new Error('Sender not found or not an entrepreneur');
    }

    if (!receiver) {
      throw new Error('Receiver not found or not an investor');
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (existingConnection) {
      if (existingConnection.status === 'pending') {
        throw new Error('Connection request already sent');
      } else if (existingConnection.status === 'accepted') {
        throw new Error('Already connected');
      } else if (existingConnection.status === 'rejected') {
        // Allow resending if previously rejected
        existingConnection.status = 'pending';
        existingConnection.createdAt = new Date();
        await existingConnection.save();
        return existingConnection;
      }
    }

    // Create new connection request
    const connection = new Connection({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    });

    await connection.save();

    // Populate sender and receiver data
    await connection.populate('sender', 'name avatarUrl');
    await connection.populate('receiver', 'name avatarUrl');

    return connection;
  }

  // Accept connection request
  async acceptConnectionRequest(connectionId, receiverId) {
    const connection = await Connection.findById(connectionId)
      .populate('sender', 'name avatarUrl')
      .populate('receiver', 'name avatarUrl');

    if (!connection) {
      throw new Error('Connection request not found');
    }
    if (connection.receiver._id.toString() !== receiverId) {
      throw new Error('Unauthorized to accept this connection request');
    }

    if (connection.status !== 'pending') {
      throw new Error('Connection request is not pending');
    }

    connection.status = 'accepted';
    await connection.save();

    return connection;
  }

  // Reject connection request
  async rejectConnectionRequest(connectionId, receiverId) {
    const connection = await Connection.findById(connectionId)
      .populate('sender', 'name avatarUrl')
      .populate('receiver', 'name avatarUrl');

    if (!connection) {
      throw new Error('Connection request not found');
    }

    if (connection.receiver._id.toString() !== receiverId) {
      throw new Error('Unauthorized to reject this connection request');
    }

    if (connection.status !== 'pending') {
      throw new Error('Connection request is not pending');
    }

    connection.status = 'rejected';
    await connection.save();

    return connection;
  }

  // Get connection requests for current user (investor)
  async getConnectionRequests(userId) {
    const connections = await Connection.find({
      receiver: userId,
      status: 'pending'
    })
    .populate('sender', 'name avatarUrl')
    .sort({ createdAt: -1 });

    return connections;
  }

  // Get connections for current user
  async getConnections(userId) {
    const connections = await Connection.find({
      $or: [
        { sender: userId, status: 'accepted' },
        { receiver: userId, status: 'accepted' }
      ]
    })
    .populate('sender', 'name avatarUrl role')
    .populate('receiver', 'name avatarUrl isOnline totalInvestments investmentStage investmentInterests bio minimumInvestment maximumInvestment')
    .sort({ updatedAt: -1 });

    return connections;
  }

  // Get connection status between two users
  async getConnectionStatus(userId1, userId2) {
    const connection = await Connection.findOne({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 }
      ]
    });

    return connection ? connection.status : 'none';
  }

  // Get sent requests for current user (entrepreneur)
  async getSentRequests(userId) {
    const connections = await Connection.find({
      sender: userId
    })
    .populate('receiver', 'name avatarUrl')
    .sort({ createdAt: -1 });

    return connections;
  }

  // Get count of connected startups for an investor
  async getConnectedStartupsCount(investorId) {
    const count = await Connection.countDocuments({
      receiver: investorId,
      status: 'accepted'
    });

    return count;
  }
}

module.exports = new ConnectionService();
