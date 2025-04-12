import React, { useState, useEffect, useRef } from 'react';
import { useChatContext } from '../context/ChatContext';
import { SessionChatMessage } from '../teleparty-websocket-lib/src/SessionChatMessage';

const ChatRoom: React.FC = () => {
  const { chatState, sendMessage, updateTypingStatus, resetChat, anyoneTyping } = useChatContext();
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [chatState.messages]);

  useEffect(() => {
    // Cleanup typing timeout on unmount
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
    
    // Handle typing indicator
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      updateTypingStatus(true);
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to clear typing status
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    sendMessage(messageInput.trim());
    setMessageInput('');
    
    // Clear typing status
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
          <div className="inline-block py-1 px-3 bg-gray-200 rounded-lg text-gray-600 text-sm">
            {message.body}
          </div>
        ) : (
          <div className="flex items-start">
            {message.userIcon ? (
              <img 
                src={message.userIcon} 
                alt={message.userNickname || 'User'} 
                className="w-8 h-8 rounded-full mr-2" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center mr-2">
                {message.userNickname ? message.userNickname.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-baseline">
                <span className="font-medium text-purple-700 mr-2">
                  {message.userNickname || 'Anonymous'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <div className="mt-1 p-2 bg-purple-50 rounded-lg text-gray-800">
                {message.body}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleLeaveRoom = () => {
    resetChat();
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 bg-purple-600 text-white flex justify-between items-center">
        <h2 className="text-xl font-bold">
          Room: {chatState.roomId}
        </h2>
        <button 
          onClick={handleLeaveRoom}
          className="px-3 py-1 bg-white text-purple-600 rounded hover:bg-purple-100 transition-colors"
        >
          Leave Room
        </button>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {chatState.messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
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
      {anyoneTyping && (
        <div className="px-4 py-2 text-sm text-gray-600 italic bg-gray-100">
          Someone is typing...
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
            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom; 