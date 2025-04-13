import React, { useState, useEffect, useRef } from 'react';
import { useChatContext } from '../context/ChatContext';
import { SessionChatMessage } from 'teleparty-websocket-lib';
import { useToast } from '../context/ToastContext';

const ChatRoom: React.FC = () => {
  const { chatState, sendMessage, updateTypingStatus, resetChat, userList, userProfile } = useChatContext();
  const toast = useToast();
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);


  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      updateTypingStatus(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    sendMessage(messageInput.trim());
    setMessageInput('');
    
    setIsTyping(false);
    updateTypingStatus(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: SessionChatMessage, index: number) => {
    return (
      <div 
        key={`${message.permId}-${index}`}
        className={`mb-4 ${message.isSystemMessage ? 'text-center' : ''}`}
      >
        {message.isSystemMessage ? (
          <div className="inline-block px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded-lg">
            {message.body}
          </div>
        ) : (
          <div className="flex items-start">
            {message.userIcon ? (
              <img 
                src={message.userIcon} 
                alt={message.userNickname || 'User'} 
                className="w-8 h-8 mr-2 rounded-full" 
              />
            ) : (
              <div className="flex items-center justify-center w-8 h-8 mr-2 text-white bg-purple-500 rounded-full">
                {message.userNickname ? message.userNickname.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-baseline">
                <span className="mr-2 font-medium text-purple-700">
                  {message.userNickname || 'Anonymous'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <div className="p-2 mt-1 text-gray-800 rounded-lg bg-purple-50">
                {message.body}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleLeaveRoom = async () => {
    try {
      toast.showInfo('Leaving the room...');
      await resetChat();
    } catch (error) {
      console.error('Error leaving room:', error);
      toast.showError('Error leaving room. Please try again.');
    }
  };

  const getTypingUsersText = () => {
    if (!chatState.usersTyping.length) return "";
    
    const filteredTypingUsers = chatState.usersTyping.filter(socketId => {
      const user = userList.find(u => u.socketConnectionId === socketId);
      return user && user.userSettings.userNickname !== userProfile?.nickname;
    });
    
    if (filteredTypingUsers.length === 0) return "";
    
    const typingUserNicknames = filteredTypingUsers
      .map(socketId => {
        const user = userList.find(u => u.socketConnectionId === socketId);
        return user?.userSettings?.userNickname || 'Someone';
      })
      .filter(Boolean);
    
    if (typingUserNicknames.length === 0) return "";
    if (typingUserNicknames.length === 1) return `${typingUserNicknames[0]} is typing...`;
    if (typingUserNicknames.length === 2) return `${typingUserNicknames[0]} and ${typingUserNicknames[1]} are typing...`;
    return `${typingUserNicknames.length} people are typing...`;
  };
  
  const otherUsersTyping = getTypingUsersText().length > 0;

  return (
    <div className="flex flex-col h-[80vh] max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-md">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 text-white bg-purple-600">
        <h2 className="text-xl font-bold">
          Room: {chatState.roomId}
        </h2>
        <button 
          onClick={handleLeaveRoom}
          className="px-3 py-1 text-purple-600 transition-colors bg-white rounded hover:bg-purple-100"
        >
          Leave Room
        </button>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {chatState.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div>
            {chatState.messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Typing Indicator */}
      {otherUsersTyping && (
        <div className="px-4 py-2 text-sm italic text-gray-600 bg-gray-100">
          {getTypingUsersText()}
        </div>
      )}
      
      {/* Message Input */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-end space-x-2">
          <textarea
            value={messageInput}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="px-4 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom; 