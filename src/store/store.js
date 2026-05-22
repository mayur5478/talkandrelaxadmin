import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { userApi } from "../services/user";
import { listenerApi } from "../services/listener";
import { authApi } from "../services/auth";
import { rechargeApi } from "../services/recharge";
import { contactApi } from "../services/contact";
import { storyApi } from "../services/stories";
import { notificationApi } from "../services/notification";
import { supportApi } from "../services/support";
import { agentApi } from "../services/agent";
export const store = configureStore({
  reducer: {
    [userApi.reducerPath]: userApi.reducer,
    [listenerApi.reducerPath]: listenerApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [rechargeApi.reducerPath]: rechargeApi.reducer,
    [contactApi.reducerPath]: contactApi.reducer,
    [storyApi.reducerPath]: storyApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [supportApi.reducerPath]: supportApi.reducer,
    [agentApi.reducerPath]: agentApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      userApi.middleware,
      listenerApi.middleware,
      authApi.middleware,
      rechargeApi.middleware,
      contactApi.middleware,
      storyApi.middleware,
      notificationApi.middleware,
      supportApi.middleware,
      agentApi.middleware,
    ]),
});

setupListeners(store.dispatch);
