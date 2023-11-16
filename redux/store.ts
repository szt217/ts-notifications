// https://redux-toolkit.js.org/rtk-query/overview#configure-the-store
// https://redux-toolkit.js.org/tutorials/rtk-query/
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { combineReducers, PayloadAction } from '@reduxjs/toolkit';
import once from 'lodash/once';
import { WebsocketMessage } from '../types';
import { api } from './api';
import { clearQueue, messageQueue } from './data';
import notifications, { setNewNotificationCount, upsertNotification } from './slices/notifications';

// mock websocket client recieves notification packet every 5 seconds
export class WebsocketClient {
  private static instance: WebsocketClient;
  private timeout?: NodeJS.Timeout;

  public static getInstance = () => {
    if (!WebsocketClient.instance) {
      WebsocketClient.instance = new WebsocketClient();
      // WebsocketClient.instance.mockSocketEvent();
      WebsocketClient.instance.handleQueue();
    }
    return WebsocketClient.instance;
  };

  // mock streaming connection, handle streaming queue from data provider
  private handleQueue = () => {
    this.timeout = setTimeout(() => {
      if (messageQueue) {
        messageQueue.forEach((m) => {
          this.onMessage(m);
        });
        clearQueue();
      }
      this.handleQueue();
    }, 50);
  };
  // handle packet recieved in notification store
  private onMessage = (message: WebsocketMessage) => {
    // upsert to handle adds, updates
    // notifications upserted but not presently viewable could be presented in the form of an in-app notification banner
    if (message.object === 'notification') store.dispatch(upsertNotification(message.notification));
    //set notication count updates in metadata
    else if (message.object === 'meta') store.dispatch(setNewNotificationCount(message.meta.newCount));
  };
}

const combinedReducer = combineReducers({
  notifications,
  [api.reducerPath]: api.reducer
});
const rootReducer = (state: any, action: PayloadAction<any>) => {
  // Init server. Code here in the root reducer for demonstration. Generally, this should be behind some level of authentication.
  const init = once(() => {
    WebsocketClient.getInstance();
  });
  init();

  return combinedReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware)
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
