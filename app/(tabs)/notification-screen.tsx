import { EntityId } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { toNumber } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, ListRenderItemInfo, RefreshControl, StyleSheet, useColorScheme } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { NotificationHeader } from '../../components/NotificationHeader';
import { NotificationRow } from '../../components/NotificationRow';
import { Text, View } from '../../components/Themed';
import Colors from '../../constants/Colors';
import {
  useGetNotificationsQuery,
  useMarkNotificationAsSeenMutation,
  useResolveFriendRequestMutation
} from '../../redux/api';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectNotificationIdsWithFilter, setNotification, upsertNotification } from '../../redux/slices/notifications';
import { store } from '../../redux/store';
import { AppNotification, FriendRequestNotification } from '../../types';
import { useIsFocused } from '@react-navigation/native';

dayjs.extend(relativeTime);

// helper constants and maps
const filters: (AppNotification['type'] | 'all')[] = ['all', 'mention', 'friend_request', 'community_invite'];
const API_LIMIT = 20;
const filterDisplayMap: Record<AppNotification['type'] | 'all', string> = {
  all: 'All',
  mention: 'Mentions',
  friend_request: 'Friend Requests',
  community_invite: 'Invites'
};

export default function NotificationsScreen() {
  // refs
  const ref = useRef<FlatList<string>>(null);

  // common hooks
  const scheme = useColorScheme();
  const isFocused = useIsFocused();
  const dispatch = useAppDispatch();

  // component state
  const [filter, setFilter] = useState<(typeof filters)[0]>('all');
  const [limit, setLimit] = useState(API_LIMIT);

  // rtk query hooks
  // simple pagination
  const { isFetching, refetch, data } = useGetNotificationsQuery(
    { filter, start: 0, limit },
    { refetchOnMountOrArgChange: true }
  );
  const [markNotificationAsSeen] = useMarkNotificationAsSeenMutation();
  const [resolveFriendRequest] = useResolveFriendRequestMutation();

  //rtk selectors
  const notificationIdsAndSections = useAppSelector((state) => selectNotificationIdsWithFilter(state, filter));

  // common functions to be preserved in memory as callbacks
  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleOnItemPress = useCallback(
    async (notification: AppNotification) => {
      // optimistic update
      const update = { ...notification, seen: true, updated_at: dayjs().valueOf() };
      store.dispatch(upsertNotification(update));
      try {
        await markNotificationAsSeen(notification.id).unwrap();
      } catch (e) {
        // do something on error, like undo optimistic update
        store.dispatch(setNotification(notification));
        alert(`something went wrong, ${JSON.stringify(e)}`);
      }
    },
    [dispatch]
  );

  const handleResolveFriendRequest = useCallback(
    async (
      notification: FriendRequestNotification,
      status: Exclude<FriendRequestNotification['status'], 'pending'>
    ) => {
      try {
        await resolveFriendRequest({ notificationId: notification.id, status }).unwrap();
      } catch (e) {
        // do something on error
        alert(`something went wrong, ${JSON.stringify(e)}`);
      }
    },
    []
  );

  const handleFilterPress = useCallback((f: typeof filter) => {
    setFilter(f);
    setLimit(API_LIMIT);
  }, []);

  const keyExtractor = useCallback((notificationId: EntityId) => `${notificationId}`, []);

  const renderItem = useCallback((section: ListRenderItemInfo<string>) => {
    if (section.item.startsWith('not_')) {
      return (
        <NotificationRow
          notificationId={`${section.item}`}
          handleOnItemPress={handleOnItemPress}
          handleResolveFriendRequest={handleResolveFriendRequest}
        />
      );
    } else {
      return <NotificationHeader timestamp={toNumber(section.item)} />;
    }
  }, []);

  const onEndReached = useCallback(() => {
    if (data?.count && data.count > limit) {
      setLimit(limit + API_LIMIT);
    }
  }, [data?.count, limit]);

  // scroll to top handler on filter change or screen focus
  useEffect(() => {
    if (isFocused) setTimeout(() => ref.current?.scrollToOffset({ animated: true, offset: 0 }), 200);
  }, [filter, isFocused]);

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {filters.map((f) => (
          <TouchableOpacity key={f} onPress={() => handleFilterPress(f)}>
            <View
              style={[
                styles.pillButton,
                f === filter
                  ? {
                      backgroundColor: Colors[scheme ?? 'light'].tint,
                      borderColor: Colors[scheme ?? 'light'].tint
                    }
                  : { borderColor: Colors[scheme ?? 'light'].background }
              ]}
            >
              <Text
                lightColor={f === filter ? '#fff' : undefined}
                darkColor={f === filter ? '#111' : undefined}
                style={styles.pillText}
              >
                {filterDisplayMap[f]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        ref={ref}
        data={notificationIdsAndSections}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 1
        }}
        keyExtractor={keyExtractor}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={handleRefetch} />}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={{ fontSize: 12, fontWeight: '500' }}>The End!</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text>No Notifications</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8
  },
  pillButton: {
    marginRight: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center'
  },
  footer: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 20,
    justifyContent: 'center'
  }
});
