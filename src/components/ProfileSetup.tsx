import React, { useState, ChangeEvent } from 'react';
import { UserProfile } from '../types';
import { useToast } from '../context/ToastContext';

interface ProfileSetupProps {
  onProfileSubmit: (profile: UserProfile) => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onProfileSubmit }) => {
  const [nickname, setNickname] = useState('');
  const [userIcon, setUserIcon] = useState<string | undefined>(undefined);
  const toast = useToast();

  const handleNicknameChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log(`[ProfileSetup] Nickname changed: ${e.target.value}`);
    setNickname(e.target.value);
  };

  const handleIconChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log(`[ProfileSetup] Profile image selected: ${file.name} (${Math.round(file.size / 1024)} KB)`);
      
      if (file.size > 1024 * 1024) {
        toast.showWarning('Image is larger than 1MB. Consider using a smaller image for better performance.');
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log(`[ProfileSetup] Image loaded successfully`);
        setUserIcon(reader.result as string);
      };
      reader.onerror = () => {
        console.error(`[ProfileSetup] Error reading image file`);
        toast.showError('Failed to read image file. Please try another image.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      console.log(`[ProfileSetup] Profile submitted with nickname: ${nickname}`);
      toast.showSuccess(`Profile set: ${nickname}`);
      onProfileSubmit({ nickname, userIcon });
    } else {
      console.log(`[ProfileSetup] Attempted to submit empty nickname`);
      toast.showError('Nickname cannot be empty');
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