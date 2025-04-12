import React, { useState, ChangeEvent } from 'react';
import { UserProfile } from '../types';

interface ProfileSetupProps {
  onProfileSubmit: (profile: UserProfile) => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onProfileSubmit }) => {
  const [nickname, setNickname] = useState('');
  const [userIcon, setUserIcon] = useState<string | undefined>(undefined);

  const handleNicknameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
  };

  const handleIconChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserIcon(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      onProfileSubmit({ nickname, userIcon });
    }
  };

  return (
    <div className="max-w-md p-6 mx-auto bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-2xl font-bold text-center text-purple-700">Set Your Profile</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nickname" className="block mb-1 text-sm font-medium text-gray-700">
            Nickname*
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={handleNicknameChange}
            required
            placeholder="Enter your nickname"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div>
          <label htmlFor="userIcon" className="block mb-1 text-sm font-medium text-gray-700">
            Profile Picture (optional)
          </label>
          <input
            id="userIcon"
            type="file"
            accept="image/*"
            onChange={handleIconChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
        </div>
        
        {userIcon && (
          <div className="flex justify-center">
            <img 
              src={userIcon} 
              alt="Profile" 
              className="object-cover w-20 h-20 border-2 border-purple-500 rounded-full" 
            />
          </div>
        )}
        
        <button
          type="submit"
          disabled={!nickname.trim()}
          className="w-full px-4 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          Continue
        </button>
      </form>
    </div>
  );
};

export default ProfileSetup; 