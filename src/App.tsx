import { ChatProvider } from './context/ChatContext';
import { ToastProvider } from './context/ToastContext';
import ChatContainer from './components/ChatContainer';

function App() {
  return (
    <div className="min-h-screen py-8 bg-gray-100">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-purple-800">Teleparty Chat</h1>
        <p className="text-gray-600">Real-time chat powered by Teleparty WebSockets</p>
      </header>
      
      <main>
        <ToastProvider>
          <ChatProvider>
            <ChatContainer />
          </ChatProvider>
        </ToastProvider>
      </main>
    </div>
  );
}

export default App;
