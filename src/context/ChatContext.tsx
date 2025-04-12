import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TelepartyClient } from 'teleparty-websocket-lib';
import { SocketEventHandler } from 'teleparty-websocket-lib';
import { SocketMessageTypes } from 'teleparty-websocket-lib';
import { SessionChatMessage } from 'teleparty-websocket-lib';
import { MessageList } from 'teleparty-websocket-lib';
import { ChatRoomState, UserProfile } from '../types';
import { useToast } from './ToastContext';
// Define an interface for the server user object structure
export interface ServerUserObject {
  socketConnectionId: string;
  permId: string;
  isHost: string;
  firebaseUid: string;
  userSettings: {
    userNickname: string;
    userIcon?: string;
  };
  isCloudPlayer: string;
}

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
  userList: ServerUserObject[];
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
  const [userList, setUserList] = useState<ServerUserObject[]>([]);
  const toast = useToast();
  useEffect(() => {
    const eventHandler: SocketEventHandler = {
      onConnectionReady: () => {
        toast.showSuccess('Connected to chat server');
        setChatState(prev => ({ ...prev, isConnected: true }));
      },
      onClose: () => {
        toast.showError('Disconnected from chat server, please refresh the page');
        setChatState(prev => ({ ...prev, isConnected: false }));
      },
      onMessage: (message: SocketMessage) => {
        handleIncomingMessage(message);
      }
    };

    const newClient = new TelepartyClient(eventHandler);
    setClient(newClient);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleIncomingMessage = (message: SocketMessage) => {
    const { type, data } = message;
    switch (type) {
      case SocketMessageTypes.SEND_MESSAGE:
        const chatMessage = data as SessionChatMessage;
        if(chatMessage.isSystemMessage){
          chatMessage.body = `${chatMessage?.userNickname} ${chatMessage.body}`;
        }
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
      case "userList":
        setUserList(data);
        break;
      default:
        if (data && data.messages) {
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
      toast.showError('Error creating room, please try again');
      console.error('Error creating room:', error);
      return null;
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!client || !userProfile) return;
    try {
        const messageList = await client.joinChatRoom(
            userProfile.nickname,
            roomId,
            userProfile.userIcon
        );
        messageList.messages.forEach(message => {
            if(message.isSystemMessage){
                message.body = `${message?.userNickname} ${message.body}`;
            }
        });
        
        setChatState(prev => ({ 
            ...prev, 
            roomId,
            messages: messageList.messages || []
        }));
    } catch (error) {
        toast.showError('Error joining room, please try again');
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
      toast.showError('Error sending message, please try again');
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
      toast.showError('Error updating typing status, please try again');
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
        anyoneTyping,
        userList
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