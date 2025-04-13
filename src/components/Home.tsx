import React, { useState } from 'react';
import { useChatContext } from '../context/ChatContext';
import { useToast } from '../context/ToastContext';

const Home: React.FC = () => {
  const { chatState, setUserProfile, createRoom, joinRoom } = useChatContext();
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const toast = useToast();

  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      console.log(`[Home] Cannot create room: no nickname provided`);
      toast.showError('Please enter a nickname');
      return;
    }

    try {
      console.log(`[Home] Creating room with nickname: ${nickname}`);
      setCreatingRoom(true);
      toast.showInfo('Creating a new room...');
      
      setUserProfile({
        nickname: nickname.trim(),
        userIcon: ''
      });
      
      await createRoom();
      console.log(`[Home] Room creation initiated`);
    } catch (error) {
      console.error(`[Home] Error creating room:`, error);
      toast.showError('Failed to create room. Please try again.');
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!nickname.trim()) {
      console.log(`[Home] Cannot join room: no nickname provided`);
      toast.showError('Please enter a nickname');
      return;
    }
    
    if (!roomId.trim()) {
      console.log(`[Home] Cannot join room: no room ID provided`);
      toast.showError('Please enter a room ID');
      return;
    }

    try {
      console.log(`[Home] Joining room ${roomId} with nickname: ${nickname}`);
      setJoiningRoom(true);
      toast.showInfo(`Joining room: ${roomId}...`);
      
      setUserProfile({
        nickname: nickname.trim(),
        userIcon: ''
      });
      
      await joinRoom(roomId.trim());
      console.log(`[Home] Room join initiated`);
    } catch (error) {
      console.error(`[Home] Error joining room:`, error);
      toast.showError('Failed to join room. Please check the room ID and try again.');
    } finally {
      setJoiningRoom(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: 'join' | 'create') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      console.log(`[Home] Enter key pressed for action: ${action}`);
      if (action === 'join') {
        handleJoinRoom();
      } else {
        handleCreateRoom();
      }
    }
  };

  const isConnecting = !chatState.isConnected;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 bg-gradient-to-b from-purple-100 to-white rounded-lg shadow-md max-w-md mx-auto">
      <h1 className="mb-8 text-3xl font-bold text-purple-800">Teleparty Chat</h1>
      
      <div className="w-full space-y-6">
        <div className="space-y-2">
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
            Your Nickname
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, roomId ? 'join' : 'create')}
            placeholder="Enter your nickname"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            disabled={isConnecting}
          />
        </div>
        
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">
              Room ID (Leave empty to create a new room)
            </label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'join')}
              placeholder="Enter room ID to join"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              disabled={isConnecting}
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleJoinRoom}
              disabled={!roomId.trim() || !nickname.trim() || isConnecting}
              className="flex-1 px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {joiningRoom ? 'Joining...' : 'Join Room'}
            </button>
            
            <button
              onClick={handleCreateRoom}
              disabled={!nickname.trim() || isConnecting}
              className="flex-1 px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {creatingRoom ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </div>
        
        {isConnecting && (
          <div className="p-3 text-blue-700 bg-blue-100 rounded-md">
            Connecting to server...
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 