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
  private currentRoomId: string | null = null;
  private currentNickname: string | null = null;
  private currentUserIcon?: string;

  constructor(eventHandler: SocketEventHandler) {
    console.log(`[EnhancedClient] Initializing new client`);
    this.eventHandler = this.enhanceEventHandler(eventHandler);
    this.client = new TelepartyClient(this.eventHandler);
    console.log(`[EnhancedClient] Client initialized successfully`);
    this.setupKeepAlive();
  }

  private enhanceEventHandler(
    originalHandler: SocketEventHandler
  ): SocketEventHandler {
    console.log(`[EnhancedClient] Setting up enhanced event handler`);
    return {
      onConnectionReady: () => {
        console.log(
          `[EnhancedClient] Connection ready, resetting reconnect attempts`
        );
        this.reconnectAttempts = 0;
        originalHandler.onConnectionReady();

        console.log(`[EnhancedClient] Checking if we need to rejoin a room`);
        this.rejoinRoomIfNeeded()
          .then((success) => {
            console.log(
              `[EnhancedClient] Room rejoin attempt result: ${success}`
            );
            if (success) {
              console.log(
                `[EnhancedClient] Emitting reconnection success event for room: ${this.currentRoomId}`
              );
              const customMessage = {
                type: "reconnection",
                data: {
                  success: true,
                  roomId: this.currentRoomId,
                },
              };
              originalHandler.onMessage(customMessage);
            } else {
              console.log(`[EnhancedClient] No room rejoined or rejoin failed`);
            }
          })
          .catch((error) => {
            console.error(`[EnhancedClient] Error in rejoin process:`, error);
          });
      },

      onClose: () => {
        if (!this.isManualClose) {
          console.log(
            `[EnhancedClient] Connection closed unexpectedly, attempting reconnect`
          );
          this.attemptReconnect();
        } else {
          console.log(`[EnhancedClient] Connection closed manually`);
          originalHandler.onClose();
        }
      },

      onMessage: (message) => {
        console.log(
          `[EnhancedClient] Received message of type: ${message.type}`
        );
        originalHandler.onMessage(message);
      },
    };
  }

  private setupKeepAlive() {
    console.log(
      `[EnhancedClient] Setting up keep-alive ping every ${KEEP_ALIVE_INTERVAL}ms`
    );
    this.keepAliveTimer = setInterval(() => {
      try {
        console.log(`[EnhancedClient] Sending keep-alive ping`);
        this.client.sendMessage("keepAlive" as any, {});
      } catch (e) {
        console.error(`[EnhancedClient] Keep alive ping failed:`, e);
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
      console.log(
        `[EnhancedClient] Scheduling reconnect attempt ${
          this.reconnectAttempts + 1
        }/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`
      );

      this.reconnectTimer = setTimeout(() => {
        console.log(
          `[EnhancedClient] Attempting to reconnect (${
            this.reconnectAttempts + 1
          }/${MAX_RECONNECT_ATTEMPTS})`
        );
        this.client = new TelepartyClient(this.eventHandler);
        this.reconnectAttempts++;
      }, delay);
    } else {
      console.log(
        `[EnhancedClient] Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached, giving up`
      );
      this.eventHandler.onClose();
    }
  }

  private rejoinRoomIfNeeded(): Promise<boolean> {
    console.log(`[EnhancedClient] Checking for room to rejoin`);
    const storedRoomId = localStorage.getItem("teleparty_room_id");
    const storedProfile = localStorage.getItem("teleparty_user_profile");

    console.log(
      `[EnhancedClient] Room data: stored=${storedRoomId}, memory=${this.currentRoomId}`
    );
    const roomId = this.currentRoomId || storedRoomId;
    let nickname = this.currentNickname;
    let userIcon = this.currentUserIcon;

    if (!nickname && storedProfile) {
      try {
        console.log(
          `[EnhancedClient] No nickname in memory, trying to use stored profile`
        );
        const profile = JSON.parse(storedProfile);
        nickname = profile.nickname;
        userIcon = profile.userIcon;
        console.log(`[EnhancedClient] Using stored profile: ${nickname}`);
      } catch (e) {
        console.error(`[EnhancedClient] Error parsing stored profile:`, e);
      }
    }

    if (roomId && nickname) {
      console.log(
        `[EnhancedClient] Attempting to rejoin room ${roomId} with nickname ${nickname}`
      );
      const storedMessagesJson = localStorage.getItem("teleparty_messages");
      console.log(
        `[EnhancedClient] Found stored messages: ${
          storedMessagesJson ? "yes" : "no"
        }`
      );

      return this.joinChatRoom(nickname, roomId, userIcon)
        .then((messageList) => {
          console.log(
            `[EnhancedClient] Successfully rejoined room after reconnection`
          );

          if (storedMessagesJson) {
            try {
              console.log(
                `[EnhancedClient] Merging stored messages with new messages`
              );
              const storedMessages = JSON.parse(storedMessagesJson);
              console.log(
                `[EnhancedClient] Stored messages: ${storedMessages.length}, new messages: ${messageList.messages.length}`
              );

              const existingMessagesMap = new Map();
              storedMessages.forEach((msg: any) => {
                existingMessagesMap.set(
                  msg.timestamp.toString() + msg.body,
                  msg
                );
              });

              let newMessageCount = 0;
              messageList.messages.forEach((newMsg: any) => {
                const key = newMsg.timestamp.toString() + newMsg.body;
                if (!existingMessagesMap.has(key)) {
                  storedMessages.push(newMsg);
                  newMessageCount++;
                }
              });

              console.log(
                `[EnhancedClient] Added ${newMessageCount} new messages from server`
              );
              storedMessages.sort(
                (a: any, b: any) => a.timestamp - b.timestamp
              );

              localStorage.setItem(
                "teleparty_messages",
                JSON.stringify(storedMessages)
              );

              messageList.messages = storedMessages;
              console.log(
                `[EnhancedClient] Message merge complete, total: ${storedMessages.length}`
              );
            } catch (e) {
              console.error(
                `[EnhancedClient] Error merging stored messages:`,
                e
              );
            }
          }

          return true;
        })
        .catch((error) => {
          console.error(
            `[EnhancedClient] Failed to rejoin room after reconnection:`,
            error
          );
          return false;
        });
    } else {
      console.log(
        `[EnhancedClient] No room data found for automatic reconnection`
      );
      return Promise.resolve(false);
    }
  }

  public async joinChatRoom(
    nickname: string,
    roomId: string,
    userIcon?: string
  ): Promise<MessageList> {
    console.log(`[EnhancedClient] Joining chat room: ${roomId} as ${nickname}`);
    this.currentRoomId = roomId;
    this.currentNickname = nickname;
    this.currentUserIcon = userIcon;

    const storedMessagesJson = localStorage.getItem("teleparty_messages");
    const storedMessages = storedMessagesJson
      ? JSON.parse(storedMessagesJson)
      : [];
    console.log(
      `[EnhancedClient] Found ${storedMessages.length} stored messages`
    );

    console.log(`[EnhancedClient] Calling library joinChatRoom`);
    const messageList = await this.client.joinChatRoom(
      nickname,
      roomId,
      userIcon
    );
    console.log(
      `[EnhancedClient] Joined room, received ${messageList.messages.length} messages`
    );

    if (storedMessages.length > 0) {
      try {
        console.log(
          `[EnhancedClient] Merging stored messages with new messages`
        );
        const existingMessagesMap = new Map();
        storedMessages.forEach((msg: any) => {
          existingMessagesMap.set(msg.timestamp.toString() + msg.body, msg);
        });

        let newMessageCount = 0;
        messageList.messages.forEach((newMsg: any) => {
          const key = newMsg.timestamp.toString() + newMsg.body;
          if (!existingMessagesMap.has(key)) {
            storedMessages.push(newMsg);
            newMessageCount++;
          }
        });

        console.log(
          `[EnhancedClient] Added ${newMessageCount} new messages from server`
        );
        storedMessages.sort((a: any, b: any) => a.timestamp - b.timestamp);

        messageList.messages = storedMessages;
        console.log(
          `[EnhancedClient] Final message count: ${messageList.messages.length}`
        );

        localStorage.setItem(
          "teleparty_messages",
          JSON.stringify(storedMessages)
        );
      } catch (e) {
        console.error(`[EnhancedClient] Error merging stored messages:`, e);
      }
    }

    return messageList;
  }

  public async createChatRoom(
    nickname: string,
    userIcon?: string
  ): Promise<string> {
    console.log(`[EnhancedClient] Creating chat room as ${nickname}`);

    const roomId = await this.client.createChatRoom(nickname, userIcon);
    console.log(`[EnhancedClient] Room created: ${roomId}`);

    this.currentRoomId = roomId;
    this.currentNickname = nickname;
    this.currentUserIcon = userIcon;

    return roomId;
  }

  public async leaveChatRoom(): Promise<boolean> {
    if (!this.currentRoomId) {
      console.log(`[EnhancedClient] Cannot leave room - not in a room`);
      return false;
    }

    try {
      console.log(`[EnhancedClient] Leaving room: ${this.currentRoomId}`);
      const leaveData = {
        sessionId: this.currentRoomId,
      };

      await new Promise<void>((resolve) => {
        console.log(`[EnhancedClient] Sending leave room message`);
        this.client.sendMessage("leaveSession" as any, leaveData, () => {
          console.log(`[EnhancedClient] Leave room response received`);
          resolve();
        });
      });

      console.log(`[EnhancedClient] Clearing room state`);
      this.currentRoomId = null;
      this.currentNickname = null;
      this.currentUserIcon = undefined;

      return true;
    } catch (error) {
      console.error(`[EnhancedClient] Error leaving room:`, error);
      return false;
    }
  }

  public sendMessage(
    type: SocketMessageTypes,
    data: any,
    callback?: CallbackFunction
  ): void {
    console.log(`[EnhancedClient] Sending message of type: ${type}`);
    this.client.sendMessage(type, data, callback);
  }

  public teardown(): void {
    console.log(`[EnhancedClient] Tearing down client`);
    this.isManualClose = true;
    this.currentRoomId = null;
    this.currentNickname = null;
    this.currentUserIcon = undefined;

    if (this.reconnectTimer) {
      console.log(`[EnhancedClient] Clearing reconnect timer`);
      clearTimeout(this.reconnectTimer);
    }

    if (this.keepAliveTimer) {
      console.log(`[EnhancedClient] Clearing keep-alive timer`);
      clearInterval(this.keepAliveTimer);
    }

    console.log(`[EnhancedClient] Closing underlying WebSocket connection`);
    this.client.teardown();
  }
}
