import { FontAwesome } from '@expo/vector-icons';
import dayjs from 'dayjs';
import React from 'react';
import { StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Text, View } from '../components/Themed';
import { useAppSelector } from '../redux/hooks';
import { selectNotificationById } from '../redux/slices/notifications';
import { AppNotification, FriendRequestNotification } from '../types';

//helper maps and functions
const notificationIconMap: Record<AppNotification['type'], React.ComponentProps<typeof FontAwesome>['name']> = {
  friend_request: 'user-plus',
  mention: 'quote-right',
  community_invite: 'users'
};
const getPrettyTimestamp = (timestamp: number) => dayjs(timestamp).fromNow();
const getNotificationText = (notification: AppNotification) => {
  if (notification.type === 'community_invite') {
    return `@${notification.user.display_name} invited you to ${notification.community.name}`;
  } else if (notification.type === 'friend_request') {
    if (notification.status === 'accepted' || notification.status === 'declined') {
      return `You've ${notification.status} @${notification.user.display_name}'s friend request`;
    } else if (notification.status === 'pending') {
      return `@${notification.user.display_name} sent you a friend request`;
    }
  } else if (notification.type === 'mention') {
    return `@${notification.user.display_name} mentioned you in #${notification.channel.name} - ${notification.community.name}`;
  }
};
export const NotificationRow: React.FC<{
  notificationId: string;
  handleOnItemPress: (notification: AppNotification) => void;
  handleResolveFriendRequest: (
    notification: FriendRequestNotification,
    status: Exclude<FriendRequestNotification['status'], 'pending'>
  ) => void;
}> = ({ notificationId, handleOnItemPress, handleResolveFriendRequest }) => {
  const notification = useAppSelector((state) => selectNotificationById(state, notificationId));
  if (!notification) return undefined;

  return (
    <>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <TouchableOpacity
        onPress={() =>
          !notification.seen ? handleOnItemPress(notification) : alert('Notification was previously viewed')
        }
        key={notification.id}
      >
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <FontAwesome
              style={styles.icon}
              color="#fff"
              size={notification.type === 'mention' ? 28 : 24}
              name={notificationIconMap[notification.type]}
            />
          </View>

          <View style={styles.inner}>
            <Text style={styles.title}>{getNotificationText(notification)}</Text>
            <Text style={styles.subtitle}>{getPrettyTimestamp(notification.created_at)}</Text>
          </View>
          <View style={styles.iconReadContainer}>
            {!notification.seen ? <FontAwesome style={styles.icon} color="#3b83f6" size={12} name="circle" /> : null}
          </View>
        </View>
        {notification.type === 'friend_request' && notification.status === 'pending' ? (
          <View style={[styles.buttonContainer]}>
            <TouchableOpacity onPress={() => handleResolveFriendRequest(notification, 'accepted')}>
              <View style={[styles.button, { borderColor: '#7572FF', backgroundColor: '#7572FF' }]}>
                <Text style={[styles.buttonText, { color: '#fff' }]}>Accept</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleResolveFriendRequest(notification, 'declined')}>
              <View style={styles.button}>
                <Text style={styles.buttonText}>Decline</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.containerPlaceholder} />
        )}
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6
  },
  separator: {
    height: 1
  },
  inner: {
    justifyContent: 'center',
    flex: 8,
    paddingLeft: 12
  },
  title: {
    fontSize: 12,
    paddingBottom: 4
  },
  subtitle: {
    fontSize: 12
  },
  iconContainer: {
    padding: 6,
    borderRadius: 4,
    alignSelf: 'center',
    backgroundColor: '#7572FF'
  },
  icon: {
    alignSelf: 'center'
  },
  iconReadContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignSelf: 'center'
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingLeft: 54
  },
  containerPlaceholder: {
    paddingLeft: 54,
    paddingBottom: 8
  },
  button: {
    marginLeft: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '500'
  }
});
