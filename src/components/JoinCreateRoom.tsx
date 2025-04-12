import React, { useState } from 'react';
import { useChatContext } from '../context/ChatContext';

const JoinCreateRoom: React.FC = () => {
  const { createRoom, joinRoom, chatState } = useChatContext();
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      const roomId = await createRoom();
      if (roomId) {
        setSuccessMessage(`Room created! Room ID: ${roomId}`);
        // Room ID is automatically set in context
      } else {
        setError('Failed to create room. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while creating the room.');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    setError(null);
    
    if (!roomIdInput.trim()) {
      setError('Please enter a room ID');
      return;
    }
    
    try {
      joinRoom(roomIdInput.trim());
      // Room joining status will be reflected in the context
    } catch (err) {
      setError('An error occurred while joining the room.');
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-purple-700">Join or Create a Chat Room</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Join an Existing Room</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              placeholder="Enter Room ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleJoinRoom}
              disabled={!roomIdInput.trim() || chatState.isConnected === false}
              className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              Join
            </button>
          </div>
        </div>
        
        <div className="text-center">
          <span className="inline-block px-4 py-1 text-sm text-gray-500">OR</span>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Create a New Room</h3>
          <button
            onClick={handleCreateRoom}
            disabled={isCreating || chatState.isConnected === false}
            className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create New Room'}
          </button>
        </div>

        {!chatState.isConnected && (
          <div className="mt-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
            Waiting for connection to be established...
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinCreateRoom; 