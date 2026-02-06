import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { fetchUserById } from '../../services/userApi';

export const ChatUserList = ({ conversations }) => {
  const navigate = useNavigate();
  const { userId: activeUserId } = useParams();
  const { user: currentUser } = useAuth();

  if (!currentUser) return null;
  const handleSelectUser = (userId) => {
    navigate(`/chat/${userId}`);
  };

  return (
    <div className="bg-white border-r border-gray-200 w-full md:w-64 overflow-y-auto">
      <div className="py-4">
        <h2 className="px-4 text-lg font-semibold text-gray-800 mb-4">
          Messages
        </h2>

        <div className="space-y-1">
          {conversations.length > 0 ? (
            conversations.map((conversation) => {
              // Get the other participant
              const otherParticipantId = conversation.participants.find(
                (id) => id !== currentUser.id
              );
              if (!otherParticipantId) return null;

              const otherUser = conversation.otherParticipant;
              if (!otherUser) return null;

              const lastMessage = conversation.lastMessage;
              const isActive = activeUserId === otherParticipantId;

              return (
                <div
                  key={conversation._id}
                  className={`px-4 py-3 flex cursor-pointer transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                  onClick={() => handleSelectUser(otherUser._id)}
                >
                  <Avatar
                    src={otherUser.avatarUrl || '/default-avatar.png'}
                    alt={otherUser.name}
                    size="md"
                    className="mr-3 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {otherUser.name}
                      </h3>

                      {lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(
                            new Date(lastMessage.createdAt),
                            { addSuffix: false }
                          )}
                        </span>
                      )}
                    </div>

                    <div className="mt-1">
                      {lastMessage && (
                        <p className="text-xs text-gray-600 truncate">
                          {lastMessage.senderId === currentUser.id
                            ? 'You: '
                            : ''}
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">
                No conversations yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};