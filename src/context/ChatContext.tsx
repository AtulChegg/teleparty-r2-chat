/* eslint-disable */
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
    
    console.log(`[ChatContext] Initializing with saved roomId: ${savedRoomId}`);
    console.log(`[ChatContext] Found saved messages: ${savedMessages ? 'yes' : 'no'}`);
    
    return {
      ...defaultChatState,
      roomId: savedRoomId,
      messages: savedMessages ? JSON.parse(savedMessages) : []
    };
  });
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const savedProfile = localStorage.getItem(USER_PROFILE_KEY);
    console.log(`[ChatContext] Found saved user profile: ${savedProfile ? 'yes' : 'no'}`);
    return savedProfile ? JSON.parse(savedProfile) : null;
  });
  
  const [anyoneTyping, setAnyoneTyping] = useState<boolean>(false);
  const [userList, setUserList] = useState<ServerUserObject[]>([]);
  const toast = useToast();
  
  useEffect(() => {
    if (userProfile) {
      console.log(`[ChatContext] Saving user profile: ${userProfile.nickname}`);
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
      toast.showInfo(`Profile set: ${userProfile.nickname}`);
    }
  }, [userProfile]);
  
  useEffect(() => {
    if (chatState.roomId) {
      console.log(`[ChatContext] Saving room ID: ${chatState.roomId}`);
      localStorage.setItem(ROOM_ID_KEY, chatState.roomId);
    } else {
      console.log(`[ChatContext] Removing room ID from storage`);
      localStorage.removeItem(ROOM_ID_KEY);
    }
  }, [chatState.roomId]);
  
  useEffect(() => {
    if (chatState.messages.length > 0) {
      console.log(`[ChatContext] Saving ${chatState.messages.length} messages to storage`);
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(chatState.messages));
    }
  }, [chatState.messages]);
  
  useEffect(() => {
    if (!chatState.roomId) {
      console.log(`[ChatContext] Removing messages from storage because roomId is null`);
      localStorage.removeItem(MESSAGES_KEY);
    }
  }, [chatState.roomId]);
  
  useEffect(() => {
    console.log(`[ChatContext] Setting up WebSocket client`);
    const eventHandler: SocketEventHandler = {
      onConnectionReady: () => {
        console.log(`[ChatContext] WebSocket connection ready`);
        toast.showSuccess('Connected to chat server');
        setChatState(prev => ({ ...prev, isConnected: true }));
      },
      onClose: () => {
        console.log(`[ChatContext] WebSocket connection closed`);
        toast.showWarning('Disconnected from chat server - attempting to reconnect');
        setChatState(prev => ({ ...prev, isConnected: false }));
      },
      onMessage: (message: SocketMessage) => {
        console.log(`[ChatContext] Received message of type: ${message.type}`);
        handleIncomingMessage(message);
      }
    };

    const newClient = new EnhancedTelepartyClient(eventHandler);
    setClient(newClient);
    toast.showInfo('Connecting to chat server...');
    
    return () => {
      console.log(`[ChatContext] Cleaning up WebSocket client`);
      if (newClient) {
        newClient.teardown();
      }
    };
  }, []);
  
  useEffect(() => {
    if (client && userProfile) {
      const savedRoomId = localStorage.getItem(ROOM_ID_KEY);
      console.log(`[ChatContext] Checking for auto-rejoin: client=${!!client}, userProfile=${!!userProfile}, savedRoomId=${savedRoomId}`);
      
      if (savedRoomId) {
        console.log(`[ChatContext] Auto-rejoining room: ${savedRoomId}`);
        toast.showInfo(`Rejoining room after page refresh: ${savedRoomId}`);
        joinRoom(savedRoomId);
      }
    }
  }, [client, userProfile]);

  const handleIncomingMessage = (message: SocketMessage) => {
    const { type, data } = message;
    console.log(`[ChatContext] Handling message: ${type}`, data);
    
    switch (type) {
      case SocketMessageTypes.SEND_MESSAGE:
        const chatMessage = data as SessionChatMessage;
        if(chatMessage.isSystemMessage){
          chatMessage.body = `${chatMessage?.userNickname} ${chatMessage.body}`;
        }
        console.log(`[ChatContext] Adding new chat message: ${chatMessage.userNickname}: ${chatMessage.body}`);
        setChatState(prev => ({
          ...prev,
          messages: [...prev.messages, chatMessage]
        }));
        break;
        
      case SocketMessageTypes.SET_TYPING_PRESENCE:
        console.log(`[ChatContext] Updating typing presence: anyoneTyping=${data.anyoneTyping}, users=${data.usersTyping?.length || 0}`);
        setAnyoneTyping(data.anyoneTyping);
        setChatState(prev => ({
          ...prev,
          usersTyping: data.usersTyping || []
        }));
        break;
        
      case "userList":
        console.log(`[ChatContext] Updating user list: ${data.length} users`);
        setUserList(data);
        if (data.length > userList.length && userList.length > 0) {
          toast.showInfo(`New user joined the room! (${data.length} users total)`);
        } else if (data.length < userList.length) {
          toast.showInfo(`A user left the room. (${data.length} users remaining)`);
        }
        break;
        
      case "reconnection":
        if (data.success && data.roomId) {
          console.log(`[ChatContext] Automatic reconnection successful: ${data.roomId}`);
          toast.showSuccess(`Successfully reconnected to room: ${data.roomId}`);
        } else {
          console.log(`[ChatContext] Automatic reconnection failed`);
          toast.showError('Reconnection failed. Attempting another reconnection...');
        }
        break;
        
      default:
        if (data && data.messages) {
          const messageList = data as MessageList;
          console.log(`[ChatContext] Received message list with ${messageList.messages.length} messages`);
          
          setChatState(prev => {
            const existingMessagesMap = new Map();
            prev.messages.forEach(msg => {
              existingMessagesMap.set(`${msg.timestamp}-${msg.body}`, msg);
            });
            
            const mergedMessages = [...prev.messages];
            let newMessageCount = 0;
            
            messageList.messages.forEach(newMsg => {
              const key = `${newMsg.timestamp}-${newMsg.body}`;
              if (!existingMessagesMap.has(key)) {
                if (newMsg.isSystemMessage) {
                  newMsg.body = `${newMsg?.userNickname} ${newMsg.body}`;
                }
                mergedMessages.push(newMsg);
                newMessageCount++;
              }
            });
            
            console.log(`[ChatContext] Merged ${newMessageCount} new messages with existing messages`);
            mergedMessages.sort((a, b) => a.timestamp - b.timestamp);
            
            if (newMessageCount > 0) {
              toast.showInfo(`Loaded ${newMessageCount} new messages`);
            }
            
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
    console.log(`[ChatContext] Creating new room`);
    if (!client || !userProfile) {
      console.error(`[ChatContext] Cannot create room: client=${!!client}, userProfile=${!!userProfile}`);
      toast.showError('Cannot create room - not connected to server');
      return null;
    }
    
    try {
      console.log(`[ChatContext] Sending create room request`);
      toast.showInfo('Creating a new chat room...');
      
      const roomId = await client.createChatRoom(
        userProfile.nickname, 
        userProfile.userIcon
      );
      
      console.log(`[ChatContext] Room created successfully: ${roomId}`);
      toast.showSuccess(`Room created successfully! ID: ${roomId}`);
      
      setChatState(prev => ({ ...prev, roomId }));
      return roomId;
    } catch (error) {
      console.error(`[ChatContext] Error creating room:`, error);
      toast.showError('Error creating room, please try again');
      return null;
    }
  };

  const joinRoom = async (roomId: string) => {
    console.log(`[ChatContext] Joining room: ${roomId}`);
    
    if (!client || !userProfile) {
      console.error(`[ChatContext] Cannot join room - client or user profile is missing`);
      toast.showError('Cannot join room - not connected to server');
      return;
    }
    
    try {
        if (chatState.roomId !== roomId) {
          console.log(`[ChatContext] Joining different room, clearing old messages`);
          localStorage.removeItem(MESSAGES_KEY);
        } else {
          console.log(`[ChatContext] Rejoining same room, keeping messages`);
        }
        
        toast.showInfo(`Joining room: ${roomId}...`);
        console.log(`[ChatContext] Sending join room request`);
        
        const messageList = await client.joinChatRoom(
            userProfile.nickname,
            roomId,
            userProfile.userIcon
        );
        
        console.log(`[ChatContext] Joined room successfully, received ${messageList.messages.length} messages`);
        
        messageList.messages.forEach(message => {
            if(message.isSystemMessage){
                message.body = `${message?.userNickname} ${message.body}`;
            }
        });
        
        if (chatState.messages.length > 0) {
          console.log(`[ChatContext] Merging with existing ${chatState.messages.length} messages`);
          
          const existingMessagesMap = new Map();
          chatState.messages.forEach(msg => {
            existingMessagesMap.set(`${msg.timestamp}-${msg.body}`, msg);
          });
          
          const mergedMessages = [...chatState.messages];
          let newMessageCount = 0;
          
          messageList.messages.forEach(newMsg => {
            const key = `${newMsg.timestamp}-${newMsg.body}`;
            if (!existingMessagesMap.has(key)) {
              mergedMessages.push(newMsg);
              newMessageCount++;
            }
          });
          
          console.log(`[ChatContext] Added ${newMessageCount} new messages from server`);
          mergedMessages.sort((a, b) => a.timestamp - b.timestamp);
          
          setChatState(prev => ({ 
              ...prev, 
              roomId,
              messages: mergedMessages
          }));
          
          toast.showSuccess(`Joined room: ${roomId} (${messageList.messages.length} messages)`);
        } else {
          console.log(`[ChatContext] No existing messages, using new message list`);
          setChatState(prev => ({ 
              ...prev, 
              roomId,
              messages: messageList.messages || []
          }));
          
          toast.showSuccess(`Joined room: ${roomId} with ${messageList.messages.length} messages`);
        }
    } catch (error) {
        console.error(`[ChatContext] Error joining room:`, error);
        toast.showError(`Error joining room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const sendMessage = (message: string) => {
    console.log(`[ChatContext] Sending message: ${message.substring(0, 20)}${message.length > 20 ? '...' : ''}`);
    
    if (!client || !chatState.roomId) {
      console.error(`[ChatContext] Cannot send message - client or roomId is missing`);
      toast.showError('Cannot send message - not connected to room');
      return;
    }
    
    try {
      client.sendMessage(SocketMessageTypes.SEND_MESSAGE, {
        body: message
      });
      console.log(`[ChatContext] Message sent successfully`);
    } catch (error) {
      console.error(`[ChatContext] Error sending message:`, error);
      toast.showError('Error sending message, please try again');
    }
  };

  const updateTypingStatus = (isTyping: boolean) => {
    if (!client || !chatState.roomId) {
      console.log(`[ChatContext] Cannot update typing status - not in a room`);
      return;
    }
    
    try {
      console.log(`[ChatContext] Updating typing status: ${isTyping}`);
      client.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, {
        typing: isTyping
      });
    } catch (error) {
      console.error(`[ChatContext] Error updating typing status:`, error);
      toast.showError('Error updating typing status');
    }
  };

  const resetChat = async () => {
    console.log(`[ChatContext] Resetting chat state`);
    
    if (client && chatState.roomId) {
      try {
        console.log(`[ChatContext] Leaving room: ${chatState.roomId}`);
        toast.showInfo('Leaving room...');
        
        const success = await client.leaveChatRoom();
        if (success) {
          console.log(`[ChatContext] Successfully left room`);
          toast.showSuccess('Successfully left the room');
        } else {
          console.log(`[ChatContext] Failed to leave room properly, will force disconnect`);
          toast.showInfo('Room connection closed');
        }
      } catch (error) {
        console.error(`[ChatContext] Error leaving room:`, error);
        toast.showError('Error leaving room, forcing disconnect');
      }
    }
    
    console.log(`[ChatContext] Clearing chat state`);
    setChatState(defaultChatState);
    
    console.log(`[ChatContext] Removing data from localStorage`);
    localStorage.removeItem(ROOM_ID_KEY);
    localStorage.removeItem(MESSAGES_KEY);
    
    if (client) {
      console.log(`[ChatContext] Tearing down client and creating a new one`);
      client.teardown();
      toast.showInfo('Reconnecting to chat server...');
      
      const eventHandler: SocketEventHandler = {
        onConnectionReady: () => {
          console.log(`[ChatContext] New client connected`);
          toast.showSuccess('Connected to chat server');
          setChatState(prev => ({ ...prev, isConnected: true }));
        },
        onClose: () => {
          console.log(`[ChatContext] New client disconnected`);
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