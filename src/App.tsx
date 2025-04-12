import React from 'react';
import { ChatProvider } from './context/ChatContext';
import ChatContainer from './components/ChatContainer';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-purple-800">Teleparty Chat</h1>
        <p className="text-gray-600">Real-time chat powered by Teleparty WebSockets</p>
      </header>
      
      <main>
        <ChatProvider>
          <ChatContainer />
        </ChatProvider>
      </main>
    </div>
  );
}

export default App;
