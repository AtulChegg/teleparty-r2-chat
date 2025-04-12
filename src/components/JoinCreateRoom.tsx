import React, { useState } from 'react';
import { useChatContext } from '../context/ChatContext';
import { useToast } from '../context/ToastContext';

const JoinCreateRoom: React.FC = () => {
  const { createRoom, joinRoom, chatState } = useChatContext();
  const toast = useToast();
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    
    try {
      const roomId = await createRoom();
      if (roomId) {
        toast.showSuccess(`Room created successfully!`);
      } else {
        toast.showError('Failed to create room. Please try again.');
      }
    } catch (err) {
      toast.showError('An error occurred while creating the room.');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (!roomIdInput.trim()) {
      toast.showWarning('Please enter a room ID');
      return;
    }
    
    try {
      joinRoom(roomIdInput.trim());
      toast.showInfo(`Joining room: ${roomIdInput.trim()}`);
    } catch (err) {
      toast.showError('An error occurred while joining the room.');
      console.error(err);
    }
  };

  return (
    <div className="max-w-md p-6 mx-auto bg-white rounded-lg shadow-md">
      <h2 className="mb-6 text-2xl font-bold text-center text-purple-700">Join or Create a Chat Room</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-medium">Join an Existing Room</h3>
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
              className="px-4 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              Join
            </button>
          </div>
        </div>
        
        <div className="text-center">
          <span className="inline-block px-4 py-1 text-sm text-gray-500">OR</span>
        </div>
        
        <div>
          <h3 className="mb-2 text-lg font-medium">Create a New Room</h3>
          <button
            onClick={handleCreateRoom}
            disabled={isCreating || chatState.isConnected === false}
            className="w-full px-4 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create New Room'}
          </button>
        </div>

        {!chatState.isConnected && (
          <div className="p-3 mt-4 text-yellow-700 bg-yellow-100 rounded-md">
            Waiting for connection to be established...
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinCreateRoom; 