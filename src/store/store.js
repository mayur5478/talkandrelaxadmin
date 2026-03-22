import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { userApi } from "../services/user";
import { listenerApi } from "../services/listener";
import { authApi } from "../services/auth";
import { rechargeApi } from "../services/recharge";
import { contactApi } from "../services/contact";
import { storyApi } from "../services/stories";
export const store = configureStore({
  reducer: {
    [userApi.reducerPath]: userApi.reducer,
    [listenerApi.reducerPath]: listenerApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [rechargeApi.reducerPath]: rechargeApi.reducer,
    [contactApi.reducerPath]: contactApi.reducer,
    [storyApi.reducerPath]: storyApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      userApi.middleware,
      listenerApi.middleware,
      authApi.middleware,
      rechargeApi.middleware,
      contactApi.middleware,
      storyApi.middleware,
    ]),
});

setupListeners(store.dispatch);
