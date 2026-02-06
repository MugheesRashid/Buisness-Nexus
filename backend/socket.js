const jwt = require("jsonwebtoken");
const {
  sendMessage,
  markAsRead,
  setOnlineStatus,
} = require("./services/messagesService");
const VideoCall = require("./models/VideoCall");
const callTimeouts = new Map();

// Store connected users
const connectedUsers = new Map();

module.exports = (io) => {
  io.use((socket, next) => {
    // Authenticate socket connection
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    
    setOnlineStatus(socket.userId, socket.userRole, true);

    // Add user to connected users
    connectedUsers.set(socket.userId, socket.id);

    // Join user's room for private messages
    socket.join(socket.userId);

    // Handle sending messages
    socket.on("sendMessage", async (data) => {
      try {
        const { receiverId, content } = data;
        
        const conversation = await sendMessage(
          socket.userId,
          receiverId,
          content,
        );

        // Emit to sender
        socket.emit("messageSent", conversation);

        // Emit to receiver if online
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          // Send the last message with timestamp field for frontend compatibility
          const messageToSend = {
            ...conversation.lastMessage.toObject(),
            timestamp: conversation.lastMessage.createdAt,
          };
          io.to(receiverSocketId).emit("newMessage", {
            ...conversation.toObject(),
            lastMessage: messageToSend,
          });
        }
      } catch (error) {
        socket.emit("messageError", { message: error.message });
      }
    });

    // Handle marking messages as read
    socket.on("markAsRead", async (data) => {
      try {
        const { conversationId } = data;
        const conversation = await markAsRead(socket.userId, conversationId);
        socket.emit("messagesRead", conversation);

        // Notify other participants
        conversation.participants.forEach((participantId) => {
          if (participantId.toString() !== socket.userId.toString()) {
            const participantSocketId = connectedUsers.get(
              participantId.toString(),
            );
            if (participantSocketId) {
              io.to(participantSocketId).emit("messageRead", {
                conversationId,
                userId: socket.userId,
              });
            }
          }
        });
      } catch (error) {
        socket.emit("readError", { message: error.message });
      }
    });

    // Handle typing indicators
    socket.on("typing", (data) => {
      const { receiverId, isTyping } = data;
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", {
          userId: socket.userId,
          isTyping,
        });
      }
    });

    socket.on("initiateCall", async (data) => {
      try {
        const { receiverId, receiverType } = data;
        const roomId = `call_${socket.userId}_${receiverId}_${Date.now()}`;

        // Create video call record
        const videoCall = new VideoCall({
          caller: socket.userId,
          callerType: socket.userRole,
          receiver: receiverId,
          receiverType,
          roomId,
          status: "ringing",
        });
        await videoCall.save();

        // Set timeout for unanswered call (30 seconds)
        const timeout = setTimeout(async () => {
          const currentCall = await VideoCall.findById(videoCall._id);
          if (currentCall && currentCall.status === "ringing") {
            currentCall.status = "missed";
            await currentCall.save();

            // Notify both parties
            const callerSocketId = connectedUsers.get(
              videoCall.caller.toString(),
            );
            if (callerSocketId) {
              io.to(callerSocketId).emit("callMissed", {
                callId: videoCall._id,
              });
            }

            const receiverSocketId = connectedUsers.get(receiverId);
            if (receiverSocketId) {
              io.to(receiverSocketId).emit("callMissed", {
                callId: videoCall._id,
              });
            }
          }
          callTimeouts.delete(videoCall._id.toString());
        }, 30000);

        callTimeouts.set(videoCall._id.toString(), timeout);

        // Notify receiver
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("incomingCall", {
            callId: videoCall._id,
            callerId: socket.userId,
            callerType: socket.userRole,
            roomId,
          });
        }

        socket.emit("callInitiated", { callId: videoCall._id, roomId });
      } catch (error) {
        console.error(error);
        socket.emit("callError", { message: error.message });
      }
    });

    // Handle call acceptance - clear timeout
    socket.on("acceptCall", async (data) => {
      try {
        const { callId } = data;

        // Clear timeout if exists
        const timeout = callTimeouts.get(callId.toString());
        if (timeout) {
          clearTimeout(timeout);
          callTimeouts.delete(callId.toString());
        }

        const videoCall = await VideoCall.findById(callId);
        if (
          !videoCall ||
          videoCall.receiver.toString() !== socket.userId.toString()
        ) {
          return socket.emit("callError", { message: "Invalid call" });
        }

        videoCall.status = "accepted";
        await videoCall.save();

        // Notify caller
        const callerSocketId = connectedUsers.get(videoCall.caller.toString());
        if (callerSocketId) {
          io.to(callerSocketId).emit("callAccepted", {
            callId,
            roomId: videoCall.roomId,
          });
        }

        socket.emit("callStarted", { callId, roomId: videoCall.roomId });
      } catch (error) {
        socket.emit("callError", { message: error.message });
      }
    });

    // Handle call rejection - clear timeout
    socket.on("rejectCall", async (data) => {
      try {
        const { callId } = data;

        // Clear timeout if exists
        const timeout = callTimeouts.get(callId.toString());
        if (timeout) {
          clearTimeout(timeout);
          callTimeouts.delete(callId.toString());
        }

        const videoCall = await VideoCall.findById(callId);
        if (
          !videoCall ||
          videoCall.receiver.toString() !== socket.userId.toString()
        ) {
          return socket.emit("callError", { message: "Invalid call" });
        }

        videoCall.status = "rejected";
        await videoCall.save();

        // Notify caller
        const callerSocketId = connectedUsers.get(videoCall.caller.toString());
        if (callerSocketId) {
          io.to(callerSocketId).emit("callRejected", { callId });
        }
      } catch (error) {
        socket.emit("callError", { message: error.message });
      }
    });

    // Handle call end
    socket.on("endCall", async (data) => {
      try {
        const { callId } = data;
        const videoCall = await VideoCall.findById(callId);
        if (!videoCall) return;

        videoCall.status = "ended";
        videoCall.endedAt = new Date();
        await videoCall.save();

        // Notify other participant
        const otherUserId =
          videoCall.caller.toString() === socket.userId.toString()
            ? videoCall.receiver.toString()
            : videoCall.caller.toString();
        const otherSocketId = connectedUsers.get(otherUserId);
        if (otherSocketId) {
          io.to(otherSocketId).emit("callEnded", { callId });
        }
      } catch (error) {
        socket.emit("callError", { message: error.message });
      }
    });

    // Handle WebRTC signaling
    socket.on("webrtcSignal", (data) => {
      const { callId, signal, to } = data;
      const targetSocketId = connectedUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtcSignal", {
          callId,
          signal,
          from: socket.userId,
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      
      setOnlineStatus(socket.userId, socket.userRole, false);
      connectedUsers.delete(socket.userId);
    });
  });
};
