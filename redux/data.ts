import Jabber from 'jabber';
import 'react-native-get-random-values';
import { v4 } from 'uuid';
import {
  AppNotification,
  CommunityInviteNotification,
  FriendRequestNotification,
  MentionNotification,
  NotificationMetaPacket,
  NotificationPacket,
  WebsocketMessage
} from '../types';
import dayjs from 'dayjs';
import { keyBy, orderBy, sumBy } from 'lodash';

const themeWordsCommunities = [
  'New York Football Giants',
  'Music',
  'Guitar',
  'US Soccer',
  'Rocket League',
  'Call Of Duty',
  'React',
  'React Native',
  'Redux Toolkit',
  'Jotai'
];

const themeWordsChannels = [
  'general',
  'help',
  'feedback',
  'announcements',
  'status',
  'getting-started',
  'community-updates',
  'faq'
];

// generate random notifications from random users with random channels/communities based on theme words
const jabber = new Jabber(themeWordsCommunities, 1);
const jabberChannels = new Jabber(themeWordsChannels, 1);

export const generateUser = () => ({
  id: `user_${v4()}`,
  display_name: jabber.createFullName(false)
});
export const generateCommunity = () => ({
  id: `com_${v4()}`,
  name: jabber.createWord(1)
});

export const generateChannel = () => ({
  id: `chan_${v4()}`,
  name: jabberChannels.createWord(1),
  isPrivate: false
});

const generateNotificationTimeStamps = (timestampOverride?: number) => {
  const timestamp = timestampOverride ? timestampOverride : dayjs().valueOf();
  return {
    updated_at: timestamp,
    created_at: timestamp
  };
};

export const generateFriendRequest = (timestampOverride?: number): FriendRequestNotification => ({
  id: `not_${v4()}`,
  type: 'friend_request',
  status: 'pending',
  user: generateUser(),
  ...generateNotificationTimeStamps(timestampOverride)
});

export const generateMention = (timestampOverride?: number): MentionNotification => ({
  id: `not_${v4()}`,
  type: 'mention',
  user: generateUser(),
  community: generateCommunity(),
  channel: generateChannel(),
  ...generateNotificationTimeStamps(timestampOverride)
});

export const generateCommunityInvite = (timestampOverride?: number): CommunityInviteNotification => ({
  id: `not_${v4()}`,
  type: 'community_invite',
  user: generateUser(),
  community: generateCommunity(),
  ...generateNotificationTimeStamps(timestampOverride)
});

export const generateData = (timestampOverride?: number) => {
  const notificationMap: AppNotification[] = [
    generateFriendRequest(timestampOverride),
    generateMention(timestampOverride),
    generateCommunityInvite(timestampOverride)
  ];
  const rand = Math.floor(Math.random() * 3);
  return notificationMap[rand];
};

export let data: AppNotification[] = Array(36)
  .fill(null)
  .map((e, i) => ({ ...generateData(dayjs().subtract(i, 'hour').valueOf()), seen: true }));
let dataMap: Record<string, AppNotification> = keyBy(data, 'id');
let meta = {
  newCount: 0
};
export let messageQueue: WebsocketMessage[] = [];

// enqueue socket packets to be recieved by mock socket client
const enqueuePackets = (notification: AppNotification, operation?: WebsocketMessage['operation']) => {
  const message: WebsocketMessage = {
    subscription: 'notifications',
    object: 'notification',
    operation: operation ?? 'created',
    notification: notification
  };
  const metaMessage: NotificationMetaPacket = {
    subscription: 'notifications',
    object: 'meta',
    operation: 'updated',
    meta
  };
  messageQueue = [...messageQueue, message, metaMessage];
};

export const addData = (notification: AppNotification) => {
  // max at 500 entries in memory
  const trimmed = data.length > 500 ? data.slice(0, 499) : data;
  data = [notification, ...trimmed];
  dataMap = keyBy(data, 'id');
  meta.newCount = sumBy(data, (d) => (d.seen ? 0 : 1));

  // mock enqueue of packets
  enqueuePackets(notification);
};

export const updateData = (update: AppNotification) => {
  dataMap[update.id] = update;
  data = orderBy(Object.values(dataMap), 'created_at', 'desc');
  meta.newCount = sumBy(data, (d) => (d.seen ? 0 : 1));

  // mock enqueue of packets
  enqueuePackets(update, 'updated');
  return update;
};

export const markNotificationAsSeen = (notificationId: string) => {
  const e = dataMap[notificationId];
  if (!e) return;
  const update = { ...e, seen: true, updated_at: dayjs().valueOf() };
  return updateData(update);
};

export const resolveFriendRequest = (notificationId: string, status: 'accepted' | 'declined') => {
  const e = dataMap[notificationId];
  if (!e) return;
  const update = { ...e, status, seen: true, updated_at: dayjs().valueOf() };
  return updateData(update);
};

export const clearQueue = () => {
  messageQueue = [];
};

const generateNewData = () => {
  const newNotification = generateData();
  addData(newNotification);
};

// simple interval to generate new notification data every 10 seconds
const newDataInterval = setInterval(() => generateNewData(), 10000);
