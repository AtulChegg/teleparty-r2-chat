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
  const [prevConnectionStatus, setPrevConnectionStatus] = useState(chatState.isConnected);

  useEffect(() => {
    console.log(`[ChatRoom] Messages updated, scrolling to bottom (${chatState.messages.length} messages)`);
    scrollToBottom();
  }, [chatState.messages]);

  useEffect(() => {
    console.log(`[ChatRoom] Component mounted`);
    
    return () => {
      console.log(`[ChatRoom] Component unmounting, cleaning up typing timeout`);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (prevConnectionStatus !== chatState.isConnected) {
      console.log(`[ChatRoom] Connection status changed: ${chatState.isConnected ? 'connected' : 'disconnected'}`);
      if (chatState.isConnected) {
        toast.showSuccess('Connected to chat server');
      } else {
        toast.showWarning('Disconnected from chat server - messages will be sent when reconnected');
      }
      setPrevConnectionStatus(chatState.isConnected);
    }
  }, [chatState.isConnected, prevConnectionStatus, toast]);

  const scrollToBottom = () => {
    console.log(`[ChatRoom] Scrolling to bottom of chat`);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessageInput(newValue);
    
    if (!isTyping && newValue.trim()) {
      console.log(`[ChatRoom] User started typing, updating status`);
      setIsTyping(true);
      updateTypingStatus(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      console.log(`[ChatRoom] User stopped typing, updating status`);
      setIsTyping(false);
      updateTypingStatus(false);
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    console.log(`[ChatRoom] Sending message: ${messageInput.substring(0, 20)}${messageInput.length > 20 ? '...' : ''}`);
    
    if (!chatState.isConnected) {
      toast.showWarning('You are currently offline. Message will be sent when connection is restored.');
    }
    
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
    const isCurrentUser = message.userNickname === userProfile?.nickname;
    const formattedTime = formatTimestamp(message.timestamp);
    
    if (message.isSystemMessage) {
      return (
        <div key={`${message.permId}-${index}`} className="flex justify-center my-4">
          <div className="inline-block px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded-lg">
            {message.body}
          </div>
        </div>
      );
    }
    
    if (isCurrentUser) {
      return (
        <div key={`${message.permId}-${index}`} className="flex justify-end mb-4">
          <div className="max-w-[80%]">
            <div className="flex flex-col items-end">
              <div className="flex items-baseline justify-end mb-1">
                <span className="mr-2 text-xs text-gray-500">
                  {formattedTime}
                </span>
                <span className="font-medium text-blue-700">
                  You
                </span>
              </div>
              <div className="p-3 text-gray-800 bg-blue-100 rounded-tl-lg rounded-bl-lg rounded-br-lg">
                {message.body}
              </div>
            </div>
          </div>
          {message.userIcon ? (
            <img 
              src={message.userIcon} 
              alt={message.userNickname || 'User'} 
              className="self-end w-8 h-8 ml-2 rounded-full" 
            />
          ) : (
            <div className="flex items-center self-end justify-center w-8 h-8 ml-2 text-white bg-blue-500 rounded-full">
              {message.userNickname ? message.userNickname.charAt(0).toUpperCase() : '?'}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div key={`${message.permId}-${index}`} className="flex justify-start mb-4">
          {message.userIcon ? (
            <img 
              src={message.userIcon} 
              alt={message.userNickname || 'User'} 
              className="self-end w-8 h-8 mr-2 rounded-full" 
            />
          ) : (
            <div className="flex items-center self-end justify-center w-8 h-8 mr-2 text-white bg-purple-500 rounded-full">
              {message.userNickname ? message.userNickname.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <div className="max-w-[80%]">
            <div className="flex flex-col">
              <div className="flex items-baseline mb-1">
                <span className="mr-2 font-medium text-purple-700">
                  {message.userNickname || 'Anonymous'}
                </span>
                <span className="text-xs text-gray-500">
                  {formattedTime}
                </span>
              </div>
              <div className="p-3 text-gray-800 bg-purple-100 rounded-tr-lg rounded-bl-lg rounded-br-lg">
                {message.body}
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const handleLeaveRoom = async () => {
    try {
      console.log(`[ChatRoom] User initiated leave room`);
      toast.showInfo('Leaving the room...');
      await resetChat();
    } catch (error) {
      console.error(`[ChatRoom] Error leaving room:`, error);
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
  
  const activeUserCount = userList.length;
  
  useEffect(() => {
    if (activeUserCount > 0) {
      console.log(`[ChatRoom] Active users in room: ${activeUserCount}`);
    }
  }, [activeUserCount]);

  return (
    <div className="flex flex-col h-[80vh] max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between p-4 text-white bg-purple-600">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold">
            Room: {chatState.roomId}
          </h2>
          <div className="text-sm text-purple-200">
            {activeUserCount > 0 ? `${activeUserCount} user${activeUserCount !== 1 ? 's' : ''} connected` : 'Connecting...'}
          </div>
        </div>
        <button 
          onClick={handleLeaveRoom}
          className="px-3 py-1 text-purple-600 transition-colors bg-white rounded hover:bg-purple-100"
        >
          Leave Room
        </button>
      </div>
      
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
      
      {otherUsersTyping && (
        <div className="px-4 py-2 text-sm italic text-gray-600 bg-gray-100">
          {getTypingUsersText()}
        </div>
      )}
      
      <div className="p-4 bg-white border-t">
        {!chatState.isConnected && (
          <div className="p-2 mb-2 text-sm text-yellow-800 bg-yellow-100 rounded">
            Reconnecting to server... Messages will be sent when connection is restored.
          </div>
        )}
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