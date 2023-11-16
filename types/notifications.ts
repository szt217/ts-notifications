// Mock types for which notification component and state management static typing is derived from
// Built this out enough to demonstrate the power and safety that TypeScript type narrowing provides in development.
export type AppNotification = MentionNotification | FriendRequestNotification | CommunityInviteNotification;

type NotificationCommon = {
  id: string;
  user: {
    id: string;
    display_name: string;
  };
  created_at: number;
  updated_at: number;
  seen?: boolean;
};

export type FriendRequestNotification = NotificationCommon & {
  type: 'friend_request';
  status: 'pending' | 'accepted' | 'declined';
};

export type MentionNotification = NotificationCommon & {
  type: 'mention';
  community: {
    id: string;
    name: string;
  };
  channel: {
    id: string;
    name: string;
    isPrivate: boolean;
  };
};

export type CommunityInviteNotification = NotificationCommon & {
  type: 'community_invite';
  community: {
    id: string;
    name: string;
  };
};

export type WebsocketMessage = NotificationPacket | NotificationMetaPacket;

export type NotificationPacket = {
  subscription: 'notifications';
  object: 'notification';
  operation: 'created' | 'updated';
  notification: AppNotification;
};

export type NotificationMetaPacket = {
  subscription: 'notifications';
  object: 'meta';
  operation: 'created' | 'updated';
  meta: { newCount: number };
};
