# Teleparty Chat App

A real-time chat application using WebSockets, powered by the Teleparty WebSocket library.

## Features

- **Create Chat Rooms**: Users can create a new chat room with one click
- **Join Existing Rooms**: Users can join an existing room using a room ID
- **Set Nickname**: Users can set their display name for the chat room
- **Profile Pictures**: Optional user profile picture upload
- **Real-time Messaging**: Instantly send and receive messages
- **Typing Indicators**: Shows exactly which users are typing messages in real-time
- **System Messages**: Notifications when users join or leave the chat
- **Message History**: Automatically loads all previous messages when joining a room
- **Enhanced Toast Notifications**: Comprehensive feedback for all user interactions:
  - Connection status changes (connected/disconnected/reconnecting)
  - Room creation and joining success/failures
  - Message sending status including offline queuing
  - Error messages with detailed context
  - User join/leave notifications
  - Profile updates
- **Responsive Design**: Works on desktop and mobile devices
- **User List**: Keeps track of all users in the room
- **Customizable Profiles**: User nicknames and optional profile images
- **Offline Support**: Messages are queued when offline and sent when reconnected
- **Automatic Reconnection**: Seamlessly handles connection drops
- **Message Persistence**: Retains messages even after page refresh

## Technologies Used

- **React 18** (with TypeScript)
- **Tailwind CSS** for styling
- **React Hot Toast** for notifications
- **Teleparty WebSocket Library** for real-time communication
- **Context API** for state management

## Getting Started

### Prerequisites

- Node.js (v16 or later recommended)
- npm or yarn

### Installation

Clone the repository

```bash
git clone <repository-url>
cd teleparty-chat-app
```

Install dependencies

```bash
npm install
# or
yarn install
```

Start the development server

```bash
npm start
# or
yarn start
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## How to Use

1. **Set Your Profile**:
   - Enter your nickname (required)
   - Upload a profile picture (optional)

2. **Join or Create a Room**:
   - To create a new room, click the "Create New Room" button
   - To join an existing room, enter the Room ID and click "Join"
   - You'll receive a toast notification confirming success or explaining any errors

3. **Chat**:
   - Type a message and press Enter or click Send
   - View incoming messages in real-time
   - See typing indicators showing exactly who is typing
   - Receive toast notifications when users join or leave
   - Leave the room by clicking the "Leave Room" button

## Project Structure

```plaintext
src/
├── components/            # React components
│   ├── ChatContainer.tsx  # Main container component
│   ├── ChatRoom.tsx       # Chat room component with messages and input
│   ├── JoinCreateRoom.tsx # Component for joining or creating rooms
│   └── ProfileSetup.tsx   # Component for setting user nickname and icon
├── context/               # React context
│   ├── ChatContext.tsx    # Context for managing chat state
│   └── ToastContext.tsx   # Context for toast notifications
├── services/              # Services
│   └── EnhancedTelepartyClient.ts  # Enhanced WebSocket client
├── types.ts               # TypeScript interfaces and types
├── App.tsx                # Main App component
└── index.tsx              # Entry point
```

## Features in Detail

### Real-time Communication

The application uses WebSockets to provide real-time bidirectional communication. Messages are delivered instantly, and users can see when others are typing.

### Enhanced Reconnection Logic

The application includes robust reconnection handling:

- Automatic reconnection with exponential backoff
- Seamless room rejoining after reconnection
- Message queue preservation during disconnection
- Toast notifications to keep users informed of connection status
- Keeps messages in sync between local storage and server

### Comprehensive Toast Notifications

The application uses a hierarchical toast system to provide feedback:

- **Success toasts** (green): Successful operations like joining rooms, creating rooms, or reconnecting
- **Error toasts** (red): Failed operations with specific error details
- **Info toasts** (blue): Informational messages like user joining/leaving, message delivery status
- **Warning toasts** (orange): Warnings like connection issues, large image uploads

### Detailed Logging

The application includes comprehensive logging for debugging:

- Component-based log prefixes (e.g., `[ChatContext]`, `[EnhancedClient]`, `[ChatRoom]`)
- Lifecycle event logging (mount, unmount, reconnect)
- Communication event logging (message send/receive, connection status)
- Error logging with stack traces
- State change logging (room joining, message updates)

### Persistent State

User data persists across page reloads:

- User profiles are saved in localStorage
- Room IDs are preserved
- Message history is stored locally and merged with server data
- Automatic room rejoining after page refresh

### Offline Support

The application handles offline scenarios gracefully:

- Visual indicators when offline
- Queuing messages for sending when connection is restored
- Toast notifications about connection status
- Automatic reconnection attempts

## License

MIT
