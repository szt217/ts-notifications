import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AppNotification } from '../types';
import { data, markNotificationAsSeen, resolveFriendRequest } from './data';
import { sumBy } from 'lodash';

// mock RTK api that interacts with in data memory provider with query functions
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    // query GET /notifications?filter=[filter]&start=[start]&limit=[limit]
    getNotifications: builder.query<
      { result: AppNotification[]; start: number; limit: number; count: number },
      { filter: AppNotification['type'] | 'all'; start: number; limit: number }
    >({
      queryFn: async ({ filter, start, limit }) => {
        const filtered = filter !== 'all' ? data.filter((e) => e.type === filter) : data;
        const res = filtered.slice(start, start + limit);

        return {
          data: {
            result: res,
            start,
            limit,
            count: data.length
          }
        };
      }
    }),
    getNotificationMeta: builder.query<{ hasNew: boolean; newCount: number }, Record<string, never>>({
      queryFn: async () => {
        const sum = sumBy(data, (d) => (!d.seen ? 1 : 0));
        return {
          data: {
            hasNew: !!sum,
            newCount: sum
          }
        };
      }
    }),
    // following api hooks would query something like PATCH /notification/:notification_id
    markNotificationAsSeen: builder.mutation<AppNotification, string>({
      queryFn: async (notificationId: string) => {
        const update = markNotificationAsSeen(notificationId);
        if (!update)
          return {
            error: {
              error: 'notification_not_found',
              status: 'CUSTOM_ERROR',
              data: { status: 404, message: "Can't find notification to update" }
            }
          };
        return {
          data: update
        };
      }
    }),
    resolveFriendRequest: builder.mutation<
      AppNotification,
      { notificationId: string; status: 'accepted' | 'declined' }
    >({
      queryFn: async ({ notificationId, status }) => {
        const update = resolveFriendRequest(notificationId, status);
        if (!update)
          return {
            error: {
              error: 'notification_not_found',
              status: 'CUSTOM_ERROR',
              data: { status: 404, message: "Can't find notification to update" }
            }
          };
        return {
          data: update
        };
      }
    })
  })
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationAsSeenMutation,
  useResolveFriendRequestMutation,
  useGetNotificationMetaQuery
} = api;
