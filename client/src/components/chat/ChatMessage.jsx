import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '../ui/Avatar';

export const ChatMessage = ({ message, isCurrentUser, currentUser, chatPartner }) => {
  const user = isCurrentUser ? currentUser : chatPartner;

  if (!user) return null;
  return (
    <div
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}
    >
      {!isCurrentUser && (
        <Avatar
          src={user.avatarUrl}
          alt={user.name}
          size="sm"
          className="mr-2 self-end"
        />
      )}

      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
            isCurrentUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>

        <span className="text-xs text-gray-500 mt-1">
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </span>
      </div>

      {isCurrentUser && (
        <Avatar
          src={user.avatarUrl}
          alt={user.name}
          size="sm"
          className="ml-2 self-end"
        />
      )}
    </div>
  );
};
