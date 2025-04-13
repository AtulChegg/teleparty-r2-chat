import {
  TelepartyClient,
  SocketEventHandler,
  SocketMessageTypes,
  MessageList,
  CallbackFunction,
} from "teleparty-websocket-lib";

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 1000;
const RECONNECT_DECAY = 2;
const KEEP_ALIVE_INTERVAL = 20000;

export class EnhancedTelepartyClient {
  private client: TelepartyClient;
  private eventHandler: SocketEventHandler;
  private reconnectAttempts: number = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private keepAliveTimer?: NodeJS.Timeout;
  private isManualClose: boolean = false;

  // Store session data for reconnection
  private currentRoomId: string | null = null;
  private currentNickname: string | null = null;
  private currentUserIcon?: string;

  constructor(eventHandler: SocketEventHandler) {
    this.eventHandler = this.enhanceEventHandler(eventHandler);
    this.client = new TelepartyClient(this.eventHandler);
    this.setupKeepAlive();
  }

  private enhanceEventHandler(
    originalHandler: SocketEventHandler
  ): SocketEventHandler {
    return {
      onConnectionReady: () => {
        this.reconnectAttempts = 0;
        originalHandler.onConnectionReady();
        this.rejoinRoomIfNeeded();
      },

      onClose: () => {
        if (!this.isManualClose) {
          this.attemptReconnect();
        } else {
          originalHandler.onClose();
        }
      },

      onMessage: (message) => {
        originalHandler.onMessage(message);
      },
    };
  }

  private setupKeepAlive() {
    this.keepAliveTimer = setInterval(() => {
      try {
        this.client.sendMessage("keepAlive" as any, {});
      } catch (e) {
        console.log("Keep alive ping failed", e);
      }
    }, KEEP_ALIVE_INTERVAL);
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }

      const delay =
        RECONNECT_INTERVAL * Math.pow(RECONNECT_DECAY, this.reconnectAttempts);

      this.reconnectTimer = setTimeout(() => {
        this.client = new TelepartyClient(this.eventHandler);

        this.reconnectAttempts++;
      }, delay);
    } else {
      this.eventHandler.onClose();
    }
  }

  private rejoinRoomIfNeeded() {
    const storedRoomId = localStorage.getItem("teleparty_room_id");
    const storedProfile = localStorage.getItem("teleparty_user_profile");

    const roomId = this.currentRoomId || storedRoomId;
    let nickname = this.currentNickname;
    let userIcon = this.currentUserIcon;

    if (!nickname && storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        nickname = profile.nickname;
        userIcon = profile.userIcon;
      } catch (e) {
        console.error("Error parsing stored profile:", e);
      }
    }

    if (roomId && nickname) {
      const storedMessagesJson = localStorage.getItem("teleparty_messages");

      this.joinChatRoom(nickname, roomId, userIcon)
        .then((messageList) => {
          if (storedMessagesJson) {
            try {
              const storedMessages = JSON.parse(storedMessagesJson);

              const existingMessagesMap = new Map();
              storedMessages.forEach((msg: any) => {
                existingMessagesMap.set(
                  msg.timestamp.toString() + msg.body,
                  msg
                );
              });

              messageList.messages.forEach((newMsg: any) => {
                const key = newMsg.timestamp.toString() + newMsg.body;
                if (!existingMessagesMap.has(key)) {
                  storedMessages.push(newMsg);
                }
              });

              storedMessages.sort(
                (a: any, b: any) => a.timestamp - b.timestamp
              );

              localStorage.setItem(
                "teleparty_messages",
                JSON.stringify(storedMessages)
              );

              messageList.messages = storedMessages;
            } catch (e) {
              console.error("Error merging stored messages:", e);
            }
          }
        })
        .catch((error) => {
          console.error("Failed to rejoin room after reconnection", error);
        });
    }
  }

  public async joinChatRoom(
    nickname: string,
    roomId: string,
    userIcon?: string
  ): Promise<MessageList> {
    this.currentRoomId = roomId;
    this.currentNickname = nickname;
    this.currentUserIcon = userIcon;

    const storedMessagesJson = localStorage.getItem("teleparty_messages");
    const storedMessages = storedMessagesJson
      ? JSON.parse(storedMessagesJson)
      : [];

    const messageList = await this.client.joinChatRoom(
      nickname,
      roomId,
      userIcon
    );

    if (storedMessages.length > 0) {
      try {
        const existingMessagesMap = new Map();
        storedMessages.forEach((msg: any) => {
          existingMessagesMap.set(msg.timestamp.toString() + msg.body, msg);
        });

        messageList.messages.forEach((newMsg: any) => {
          const key = newMsg.timestamp.toString() + newMsg.body;
          if (!existingMessagesMap.has(key)) {
            storedMessages.push(newMsg);
          }
        });

        storedMessages.sort((a: any, b: any) => a.timestamp - b.timestamp);

        messageList.messages = storedMessages;

        localStorage.setItem(
          "teleparty_messages",
          JSON.stringify(storedMessages)
        );
      } catch (e) {
        console.error("Error merging stored messages:", e);
      }
    }

    return messageList;
  }

  public async createChatRoom(
    nickname: string,
    userIcon?: string
  ): Promise<string> {
    const roomId = await this.client.createChatRoom(nickname, userIcon);

    this.currentRoomId = roomId;
    this.currentNickname = nickname;
    this.currentUserIcon = userIcon;

    return roomId;
  }

  public async leaveChatRoom(): Promise<boolean> {
    if (!this.currentRoomId) {
      return false;
    }

    try {
      const leaveData = {
        sessionId: this.currentRoomId,
      };

      await new Promise<void>((resolve) => {
        this.client.sendMessage("leaveSession" as any, leaveData, () => {
          resolve();
        });
      });

      this.currentRoomId = null;
      this.currentNickname = null;
      this.currentUserIcon = undefined;

      return true;
    } catch (error) {
      console.error("Error leaving room:", error);
      return false;
    }
  }

  public sendMessage(
    type: SocketMessageTypes,
    data: any,
    callback?: CallbackFunction
  ): void {
    this.client.sendMessage(type, data, callback);
  }

  public teardown(): void {
    this.isManualClose = true;
    this.currentRoomId = null;
    this.currentNickname = null;
    this.currentUserIcon = undefined;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }

    this.client.teardown();
  }
}
