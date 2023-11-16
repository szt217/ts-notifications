import { createEntityAdapter, createSelector, createSlice, Draft, PayloadAction } from '@reduxjs/toolkit';
import { AppNotification } from '../../types';
import { RootState } from '../store';
import { api } from '../api';
import { flattenDeep, groupBy, set, sumBy } from 'lodash';
import { shallowEqual } from 'react-redux';
import dayjs from 'dayjs';

// Adapter sorts ids by created_at timestamp
export const notificationsAdapter = createEntityAdapter<AppNotification>({
  sortComparer: (a, b) => {
    if (a.created_at === b.created_at) {
      b.id > a.id ? 1 : -1;
    }
    return b.created_at - a.created_at;
  }
});

const initialState = notificationsAdapter.getInitialState({
  newCount: 0
});
type StateDraft = Draft<typeof initialState>;

// general should update guard to prevent uneccessary updates on cache hits
const shouldUpdate = (item: AppNotification, state: StateDraft) => {
  const hit = state.entities[item.id];
  return !hit || hit.updated_at < item.updated_at;
};

export const {
  selectAll: selectAllNotifications,
  selectIds: selectNotificationIds,
  selectById: selectNotificationById
} = notificationsAdapter.getSelectors((state: RootState) => state.notifications);

const applyNotificationUpsert = (state: StateDraft, notification: AppNotification) => {
  if (!shouldUpdate(notification, state)) return state;
  notificationsAdapter.upsertOne(state, notification);
  return state;
};

const applyNotificationsSet = (state: StateDraft, notifications: AppNotification[]) => {
  notificationsAdapter.setAll(state, notifications);
  return state;
};

const applyNotificationSet = (state: StateDraft, notification: AppNotification) => {
  notificationsAdapter.setOne(state, notification);
  return state;
};

const setNewCount = (state: StateDraft, count: number) => {
  set(state, 'newCount', count);
  return state;
};

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    upsertNotification: (state, action: PayloadAction<AppNotification>) => {
      return applyNotificationUpsert(state, action.payload);
    },
    setNewNotificationCount: (state, action: PayloadAction<number>) => {
      return setNewCount(state, action.payload);
    },
    setNotification: (state, action: PayloadAction<AppNotification>) => {
      return applyNotificationSet(state, action.payload);
    }
  },
  extraReducers: (builder) => {
    builder.addMatcher(api.endpoints.getNotifications.matchFulfilled, (state, { payload }) => {
      return applyNotificationsSet(state, payload.result);
    });
    builder.addMatcher(api.endpoints.getNotificationMeta.matchFulfilled, (state, { payload }) => {
      return setNewCount(state, payload.newCount);
    });
    builder.addMatcher(api.endpoints.markNotificationAsSeen.matchFulfilled, (state, { payload }) => {
      return applyNotificationUpsert(state, payload);
    });
    builder.addMatcher(api.endpoints.resolveFriendRequest.matchFulfilled, (state, { payload }) => {
      return applyNotificationUpsert(state, payload);
    });
  }
});

export const { upsertNotification, setNotification, setNewNotificationCount } = notificationsSlice.actions;

export const selectNewNotificationCount = (state: RootState) => state.notifications.newCount;

const getParams = (state: RootState, filter: AppNotification['type'] | 'all') => filter;
export const selectNotificationIdsWithFilter = createSelector(
  selectAllNotifications,
  getParams,
  (notifications, filter) => {
    const filteredNotifications = filter !== 'all' ? notifications.filter((n) => n.type === filter) : notifications;
    const groups = groupBy(filteredNotifications, (n) => dayjs(n.created_at).startOf('day').valueOf());
    return flattenDeep<string | AppNotification>(Object.entries(groups)).map((e) => (typeof e === 'string' ? e : e.id));
  },
  {
    memoizeOptions: {
      resultEqualityCheck: shallowEqual
    }
  }
);

export default notificationsSlice.reducer;
