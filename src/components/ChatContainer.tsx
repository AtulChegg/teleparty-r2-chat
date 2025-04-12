import React from 'react';
import { useChatContext } from '../context/ChatContext';
import ProfileSetup from './ProfileSetup';
import JoinCreateRoom from './JoinCreateRoom';
import ChatRoom from './ChatRoom';

const ChatContainer: React.FC = () => {
  const { userProfile, setUserProfile, chatState } = useChatContext();

  // If the user hasn't set up their profile yet, show the profile setup screen
  if (!userProfile) {
    return <ProfileSetup onProfileSubmit={setUserProfile} />;
  }

  // If the user has a profile but isn't in a room yet, show the join/create screen
  if (!chatState.roomId) {
    return <JoinCreateRoom />;
  }

  // If the user is in a room, show the chat room
  return <ChatRoom />;
};

export default ChatContainer; 