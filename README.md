# Teleparty Chat App

A real-time chat application using WebSockets, powered by the Teleparty WebSocket library.

## Features

- **Create Chat Rooms**: Users can create a new chat room with one click
- **Join Existing Rooms**: Users can join an existing room using a room ID
- **Set Nickname**: Users can set their display name for the chat room
- **Profile Pictures**: Optional user profile picture upload
- **Real-time Messaging**: Instantly send and receive messages
- **Typing Indicators**: See when someone is typing a message
- **System Messages**: Notifications when users join or leave the chat
- **Message History**: Load all previous messages when joining a room (if available)

## Technologies Used

- React (with TypeScript)
- Tailwind CSS for styling
- Teleparty WebSocket library for communication

## Getting Started

### Prerequisites

- Node.js (v16 or later recommended)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd teleparty-chat-app
```

1. Install dependencies

```bash
npm install
# or
yarn install
```

1. Start the development server

```bash
npm start
# or
yarn start
```

1. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## How to Use

1. **Set Your Profile**:

   - Enter your nickname (required)
   - Upload a profile picture (optional)

1. **Join or Create a Room**:

   - To create a new room, click the "Create New Room" button
   - To join an existing room, enter the Room ID and click "Join"

1. **Chat**:

   - Type a message and press Enter or click Send
   - View incoming messages in real-time
   - See typing indicators when someone is typing
   - Leave the room by clicking the "Leave Room" button

## Project Structure

```plaintext
src/
├── components/         # React components
│   ├── ChatContainer.tsx     # Main container component
│   ├── ChatRoom.tsx          # Chat room component with messages and input
│   ├── JoinCreateRoom.tsx    # Component for joining or creating rooms
│   └── ProfileSetup.tsx      # Component for setting user nickname and icon
├── context/            # React context
│   └── ChatContext.tsx       # Context for managing chat state
├── types.ts            # TypeScript interfaces and types
├── App.tsx             # Main App component
└── index.tsx           # Entry point
```

## License

MIT
