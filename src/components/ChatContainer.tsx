import React from 'react';
import { useChatContext } from '../context/ChatContext';
import ProfileSetup from './ProfileSetup';
import JoinCreateRoom from './JoinCreateRoom';
import ChatRoom from './ChatRoom';

const ChatContainer: React.FC = () => {
  const { chatState, userProfile, setUserProfile } = useChatContext();
  
  
  let currentComponent;
  
  if (!userProfile) {
    currentComponent = <ProfileSetup onProfileSubmit={setUserProfile} />;
  } else if (!chatState.roomId) {
    currentComponent = <JoinCreateRoom />;
  } else {
    currentComponent = <ChatRoom />;
  }

  return <div>{currentComponent}</div>;
};

export default ChatContainer; 