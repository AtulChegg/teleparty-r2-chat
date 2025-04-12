import { SessionChatMessage } from "./teleparty-websocket-lib/src/SessionChatMessage";

export interface UserProfile {
  nickname: string;
  userIcon?: string;
}

export interface ChatRoomState {
  roomId: string | null;
  messages: SessionChatMessage[];
  isConnected: boolean;
  usersTyping: string[];
}
