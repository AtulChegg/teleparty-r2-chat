import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SocketEventHandler } from 'teleparty-websocket-lib';
import { SocketMessageTypes } from 'teleparty-websocket-lib';
import { SessionChatMessage } from 'teleparty-websocket-lib';
import { MessageList } from 'teleparty-websocket-lib';
import { ChatRoomState, UserProfile } from '../types';
import { useToast } from './ToastContext';
import { EnhancedTelepartyClient } from '../services/EnhancedTelepartyClient';

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
  client: EnhancedTelepartyClient | null;
  chatState: ChatRoomState;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  createRoom: () => Promise<string | null>;
  joinRoom: (roomId: string) => void;
  sendMessage: (message: string) => void;
  updateTypingStatus: (isTyping: boolean) => void;
  resetChat: () => Promise<void>;
  anyoneTyping: boolean;
  userList: ServerUserObject[];
}

const defaultChatState: ChatRoomState = {
  roomId: null,
  messages: [],
  isConnected: false,
  usersTyping: []
};

const USER_PROFILE_KEY = 'teleparty_user_profile';
const ROOM_ID_KEY = 'teleparty_room_id';
const MESSAGES_KEY = 'teleparty_messages';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<EnhancedTelepartyClient | null>(null);
  const [chatState, setChatState] = useState<ChatRoomState>(() => {
      
    const savedRoomId = localStorage.getItem(ROOM_ID_KEY);
    const savedMessages = localStorage.getItem(MESSAGES_KEY);
    
    return {
      ...defaultChatState,
      roomId: savedRoomId,
      messages: savedMessages ? JSON.parse(savedMessages) : []
    };
  });
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const savedProfile = localStorage.getItem(USER_PROFILE_KEY);
    return savedProfile ? JSON.parse(savedProfile) : null;
  });
  
  const [anyoneTyping, setAnyoneTyping] = useState<boolean>(false);
  const [userList, setUserList] = useState<ServerUserObject[]>([]);
  const toast = useToast();
  
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
    }
  }, [userProfile]);
  
  useEffect(() => {
    if (chatState.roomId) {
      localStorage.setItem(ROOM_ID_KEY, chatState.roomId);
    } else {
      localStorage.removeItem(ROOM_ID_KEY);
    }
  }, [chatState.roomId]);
  
  useEffect(() => {
    if (chatState.messages.length > 0) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(chatState.messages));
    }
  }, [chatState.messages]);
  
  useEffect(() => {
    if (!chatState.roomId) {
      localStorage.removeItem(MESSAGES_KEY);
    }
  }, [chatState.roomId]);
  
  useEffect(() => {
    const eventHandler: SocketEventHandler = {
      onConnectionReady: () => {
        toast.showSuccess('Connected to chat server');
        setChatState(prev => ({ ...prev, isConnected: true }));
      },
      onClose: () => {
        toast.showError('Disconnected from chat server');
        setChatState(prev => ({ ...prev, isConnected: false }));
      },
      onMessage: (message: SocketMessage) => {
        handleIncomingMessage(message);
      }
    };

    const newClient = new EnhancedTelepartyClient(eventHandler);
    setClient(newClient);
    
    return () => {
      if (newClient) {
        newClient.teardown();
      }
    };
    // eslint-disable-next-line
  }, []);
  
  useEffect(() => {
    if (client && userProfile) {
      const savedRoomId = localStorage.getItem(ROOM_ID_KEY);
      
      if (savedRoomId) {
        joinRoom(savedRoomId);
      }
    }
    // eslint-disable-next-line
  }, [client, userProfile]);

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
          
          setChatState(prev => {
            const existingMessagesMap = new Map();
            prev.messages.forEach(msg => {
              existingMessagesMap.set(`${msg.timestamp}-${msg.body}`, msg);
            });
            
            const mergedMessages = [...prev.messages];
            messageList.messages.forEach(newMsg => {
              const key = `${newMsg.timestamp}-${newMsg.body}`;
              if (!existingMessagesMap.has(key)) {
                if (newMsg.isSystemMessage) {
                  newMsg.body = `${newMsg?.userNickname} ${newMsg.body}`;
                }
                mergedMessages.push(newMsg);
              }
            });
            
            mergedMessages.sort((a, b) => a.timestamp - b.timestamp);
            
            return {
              ...prev,
              messages: mergedMessages
            };
          });
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
    if (!client || !userProfile) {
      console.error("Cannot join room - client or user profile is missing");
      return;
    }
    try {
        if (chatState.roomId !== roomId) {
          localStorage.removeItem(MESSAGES_KEY);
        } 
        
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
        
        if (chatState.messages.length > 0) {
          const existingMessagesMap = new Map();
          chatState.messages.forEach(msg => {
            existingMessagesMap.set(`${msg.timestamp}-${msg.body}`, msg);
          });
          
          const mergedMessages = [...chatState.messages];
          messageList.messages.forEach(newMsg => {
            const key = `${newMsg.timestamp}-${newMsg.body}`;
            if (!existingMessagesMap.has(key)) {
              mergedMessages.push(newMsg);
            }
          });
          
          mergedMessages.sort((a, b) => a.timestamp - b.timestamp);
          
          setChatState(prev => ({ 
              ...prev, 
              roomId,
              messages: mergedMessages
          }));
        } else {
          setChatState(prev => ({ 
              ...prev, 
              roomId,
              messages: messageList.messages || []
          }));
        }
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

  const resetChat = async () => {
    if (client && chatState.roomId) {
      try {
        const success = await client.leaveChatRoom();
        if (success) {
          toast.showSuccess('Successfully left the room');
        }
      } catch (error) {
        toast.showError('Error leaving room, please try again');
        console.error('Error leaving room:', error);
      }
    }
    
    setChatState(defaultChatState);
    
    localStorage.removeItem(ROOM_ID_KEY);
    localStorage.removeItem(MESSAGES_KEY);
    
    if (client) {
      client.teardown();
      
      const eventHandler: SocketEventHandler = {
        onConnectionReady: () => {
          toast.showSuccess('Connected to chat server');
          setChatState(prev => ({ ...prev, isConnected: true }));
        },
        onClose: () => {
          toast.showError('Disconnected from chat server');
          setChatState(prev => ({ ...prev, isConnected: false }));
        },
        onMessage: (message: SocketMessage) => {
          handleIncomingMessage(message);
        }
      };
  
      const newClient = new EnhancedTelepartyClient(eventHandler);
      setClient(newClient);
    }
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