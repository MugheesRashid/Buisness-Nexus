import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Send, Phone, Video, Info, Smile } from "lucide-react";
import { io } from "socket.io-client";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ChatMessage } from "../../components/chat/ChatMessage";
import { ChatUserList } from "../../components/chat/ChatUserList";
import { useAuth } from "../../context/AuthContext";
import { fetchPartnerById } from "../../services/userApi";
import {
  getMessages,
  sendMessage as sendMessageApi,
  getConversations,
} from "../../services/messagesApi";
import { MessageCircle } from "lucide-react";
import { VideoCallModal } from "../../components/chat/VideoCallModal";
import { toast } from "react-hot-toast";

export const ChatPage = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [socket, setSocket] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);
  const [loadingPartner, setLoadingPartner] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [currentCallData, setCurrentCallData] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Connect to socket
    const token = localStorage.getItem("authToken");
    const newSocket = io("http://localhost:5000", {
      auth: { token },
    });
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on("newMessage", (conversation) => {
      // Update messages if the conversation is with the current userId
      if (conversation.participants.includes(userId)) {
        setMessages((prev) => [...prev, conversation.lastMessage]);
      }
      // Don't update conversations here to avoid data structure issues
      // Conversations will be refreshed when needed
    });

    // Typing indicator listeners
    newSocket.on("userTyping", (data) => {
      if (data.userId === userId) {
        setPartnerTyping(data.isTyping);
      }
    });

    // Video call listeners
    // Video call listeners
    newSocket.on("incomingCall", (data) => {
      console.log("Incoming call:", data);
      setCurrentCallData(data);
      setIsVideoCallOpen(true);
    });

    newSocket.on("callInitiated", (data) => {
      console.log("Call initiated:", data);
      setCurrentCallData({
        callId: data.callId,
        callerId: currentUser.id,
        receiverId: userId,
        roomId: data.roomId,
      });
      setIsVideoCallOpen(true);
    });
       newSocket.on("callMissed", ({ callId }) => {
      console.log("Call missed:", callId);
      setIsVideoCallOpen(false);
      setCurrentCallData(null);
      toast.error("Call missed");
    });
    newSocket.on("callAccepted", (data) => {
      console.log("Call accepted:", data);
      setCurrentCallData((prev) => ({ ...prev, ...data }));
      toast.success("Call accepted!");
    });

    newSocket.on("callRejected", () => {
      console.log("Call rejected");
      setIsVideoCallOpen(false);
      setCurrentCallData(null);
      toast.error("Call rejected");
    });

    newSocket.on("callEnded", () => {
      console.log("Call ended");
      setIsVideoCallOpen(false);
      setCurrentCallData(null);
      toast("Call ended");
    });

    newSocket.on("callError", (error) => {
      console.error("Call error:", error);
      toast.error(`Call error: ${error.message}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser, userId]);

  const handleInitiateVideoCall = () => {
    console.log("Initiating video call...");
    console.log({ socket, userId, chatPartner });
    // if (!socket || !userId || !chatPartner) return;

    // Determine receiver type based on chatPartner data
    // You may need to adjust this based on your user type system
    const receiverType = chatPartner.role; // Default to 'user' if role not available

    socket.emit("initiateCall", {
      receiverId: userId,
      receiverType: receiverType,
    });
  };

  const handleAcceptCall = () => {
    if (!socket || !currentCallData) return;
    socket.emit("acceptCall", { callId: currentCallData.callId });
  };

  const handleRejectCall = () => {
    if (!socket || !currentCallData) return;
    socket.emit("rejectCall", { callId: currentCallData.callId });
    setIsVideoCallOpen(false);
    setCurrentCallData(null);
  };

  useEffect(() => {
    // Load conversations
    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        setConversations(data);
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
    };
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    // Load chat partner data
    const fetchChatPartner = async () => {
      if (!userId) return;

      try {
        setLoadingPartner(true);
        const partnerData = await fetchPartnerById(userId);
        setChatPartner(partnerData);
      } catch (error) {
        console.error("Failed to load chat partner:", error);
      } finally {
        setLoadingPartner(false);
      }
    };

    fetchChatPartner();
  }, [userId]);

  useEffect(() => {
    // Load messages between users
    const fetchMessages = async () => {
      try {
        const data = await getMessages(userId);
        setMessages(data);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };
    if (currentUser && userId) {
      fetchMessages();
    }
  }, [currentUser, userId]);

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!socket || !userId) return;

    // Send typing start event
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { receiverId: userId, isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", { receiverId: userId, isTyping: false });
    }, 1000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUser || !userId || !socket) return;

    try {
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        socket.emit("typing", { receiverId: userId, isTyping: false });
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }

      // Send via socket
      socket.emit("sendMessage", { receiverId: userId, content: newMessage });

      // Optimistically update UI
      const tempMessage = {
        _id: Date.now().toString(),
        content: newMessage,
        senderId: currentUser.id,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");

      // Update conversations
      const updatedConversations = await getConversations();
      setConversations(updatedConversations);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
      {/* Conversations sidebar */}
      <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200">
        <ChatUserList conversations={conversations} />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        {chatPartner ? (
          <>
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Avatar
                  src={chatPartner.avatarUrl}
                  alt={chatPartner.name}
                  size="md"
                  status={chatPartner.isOnline ? "online" : "offline"}
                  className="mr-3"
                />

                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {chatPartner.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {chatPartner.isOnline ? "Online" : "Last seen recently"}
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Video call"
                  onClick={handleInitiateVideoCall}
                  disabled={!chatPartner.isOnline}
                >
                  <Video size={18} />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="View profile"
                  onClick={() => {
                    // Navigate to partner's profile
                    const profilePath = chatPartner.role === 'entrepreneur'
                      ? `/profile/entrepreneur/${userId}`
                      : `/profile/investor/${userId}`;
                    window.open(profilePath, '_blank');
                  }}
                >
                  <Info size={18} />
                </Button>
              </div>
            </div>

            {/* Messages container */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.length > 0 ? (
                <div className="space-y-4 h-full">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message._id}
                      message={message}
                      isCurrentUser={message.senderId === currentUser.id}
                      currentUser={currentUser}
                      chatPartner={chatPartner}
                    />
                  ))}
                  {partnerTyping && (
                    <div className="flex justify-start mb-4 animate-fade-in">
                      <div className="flex items-center space-x-2">
                        <Avatar
                          src={chatPartner.avatarUrl}
                          alt={chatPartner.name}
                          size="sm"
                          className="mr-2"
                        />
                        <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-none">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <MessageCircle size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700">
                    No messages yet
                  </h3>
                  <p className="text-gray-500 mt-1">
                    Send a message to start the conversation
                  </p>
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Add emoji"
                >
                  <Smile size={20} />
                </Button>

                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  fullWidth
                  className="flex-1"
                />

                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMessage.trim()}
                  className="rounded-full p-2 w-10 h-10 flex items-center justify-center"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <MessageCircle size={48} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-medium text-gray-700">
              Select a conversation
            </h2>
            <p className="text-gray-500 mt-2 text-center">
              Choose a contact from the list to start chatting
            </p>
          </div>
        )}
      </div>

      <VideoCallModal
        isOpen={isVideoCallOpen}
        onClose={() => {
          setIsVideoCallOpen(false);
          setCurrentCallData(null);
        }}
        callData={currentCallData}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    </div>
  );
};
