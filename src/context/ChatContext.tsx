import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TelepartyClient } from '../teleparty-websocket-lib/src/TelepartyClient';
import { SocketEventHandler } from '../teleparty-websocket-lib/src/SocketEventHandler';
import { SocketMessageTypes } from '../teleparty-websocket-lib/src/SocketMessageTypes';
import { SessionChatMessage } from '../teleparty-websocket-lib/src/SessionChatMessage';
import { MessageList } from '../teleparty-websocket-lib/src/MessageList';
import { ChatRoomState, UserProfile } from '../types';

// Define the SocketMessage interface locally
interface SocketMessage {
  type: string;
  data: any;
  callbackId?: string;
}

interface ChatContextType {
  client: TelepartyClient | null;
  chatState: ChatRoomState;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  createRoom: () => Promise<string | null>;
  joinRoom: (roomId: string) => void;
  sendMessage: (message: string) => void;
  updateTypingStatus: (isTyping: boolean) => void;
  resetChat: () => void;
  anyoneTyping: boolean;
}

const defaultChatState: ChatRoomState = {
  roomId: null,
  messages: [],
  isConnected: false,
  usersTyping: []
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<TelepartyClient | null>(null);
  const [chatState, setChatState] = useState<ChatRoomState>(defaultChatState);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [anyoneTyping, setAnyoneTyping] = useState<boolean>(false);

  useEffect(() => {
    // Initialize the client when the component mounts
    const eventHandler: SocketEventHandler = {
      onConnectionReady: () => {
        console.log('Connection established');
        setChatState(prev => ({ ...prev, isConnected: true }));
      },
      onClose: () => {
        console.log('Socket closed');
        setChatState(prev => ({ ...prev, isConnected: false }));
        // You could display a message to the user here
      },
      onMessage: (message: SocketMessage) => {
        handleIncomingMessage(message);
      }
    };

    const newClient = new TelepartyClient(eventHandler);
    setClient(newClient);

    return () => {
      // Clean up logic if needed
    };
  }, []);

  const handleIncomingMessage = (message: SocketMessage) => {
    const { type, data } = message;

    switch (type) {
      case SocketMessageTypes.SEND_MESSAGE:
        const chatMessage = data as SessionChatMessage;
        setChatState(prev => ({
          ...prev,
          messages: [...prev.messages, chatMessage]
        }));
        break;
      case SocketMessageTypes.SET_TYPING_PRESENCE:
        setAnyoneTyping(data.anyoneTyping);
        setChatState(prev => ({
          ...prev,
          usersTyping: data.usersTyping || []
        }));
        break;
      default:
        // Handle other message types if needed
        if (data && data.messages) {
          // Handle message history (optional functionality)
          const messageList = data as MessageList;
          setChatState(prev => ({
            ...prev,
            messages: messageList.messages
          }));
        }
        break;
    }
  };

  const createRoom = async (): Promise<string | null> => {
    if (!client || !userProfile) return null;
    
    try {
      const roomId = await client.createChatRoom(
        userProfile.nickname, 
        userProfile.userIcon
      );
      setChatState(prev => ({ ...prev, roomId }));
      return roomId;
    } catch (error) {
      console.error('Error creating room:', error);
      return null;
    }
  };

  const joinRoom = (roomId: string) => {
    if (!client || !userProfile) return;
    
    try {
      client.joinChatRoom(
        userProfile.nickname,
        roomId,
        userProfile.userIcon
      );
      setChatState(prev => ({ ...prev, roomId }));
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const sendMessage = (message: string) => {
    if (!client || !chatState.roomId) return;
    
    try {
      client.sendMessage(SocketMessageTypes.SEND_MESSAGE, {
        body: message
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const updateTypingStatus = (isTyping: boolean) => {
    if (!client || !chatState.roomId) return;
    
    try {
      client.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, {
        typing: isTyping
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  const resetChat = () => {
    setChatState(defaultChatState);
  };

  return (
    <ChatContext.Provider
      value={{
        client,
        chatState,
        userProfile,
        setUserProfile,
        createRoom,
        joinRoom,
        sendMessage,
        updateTypingStatus,
        resetChat,
        anyoneTyping
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}; 