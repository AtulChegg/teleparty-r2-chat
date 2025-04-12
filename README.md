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
- **Toast Notifications**: Non-intrusive notifications for important events:
  - Connection status (connected/disconnected)
  - Room creation and joining success/failures
  - Error messages
  - User join/leave notifications
- **Responsive Design**: Works on desktop and mobile devices
- **User List**: Keeps track of all users in the room
- **Customizable Profiles**: User nicknames and optional profile images

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
├── components/           # React components
│   ├── ChatContainer.tsx       # Main container component
│   ├── ChatRoom.tsx            # Chat room component with messages and input
│   ├── JoinCreateRoom.tsx      # Component for joining or creating rooms
│   └── ProfileSetup.tsx        # Component for setting user nickname and icon
├── context/              # React context
│   ├── ChatContext.tsx         # Context for managing chat state
│   └── ToastContext.tsx        # Context for toast notifications
├── types.ts              # TypeScript interfaces and types
├── App.tsx               # Main App component
└── index.tsx             # Entry point
```

## Features in Detail

### Real-time Communication

The application uses WebSockets to provide real-time bidirectional communication. Messages are delivered instantly, and users can see when others are typing.

### Toast Notifications

Toast notifications provide feedback for important events:

- Success toasts for successful operations (green)
- Error toasts for failed operations (red)
- Info toasts for informational messages (blue)
- Warning toasts for warnings (orange)

### User Presence

The application keeps track of who is online and shows notifications when users join or leave the chat room.

### Message Types

The chat supports different types of messages:

- Regular user messages
- System messages (join/leave notifications)

### Typing Indicators

When users are typing, the application shows exactly which users are currently typing, with different messages based on the number of people typing.

## License

MIT
