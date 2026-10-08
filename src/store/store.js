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
import { monitoringApi } from "../services/monitoring";
import { systemResetApi } from "../services/systemReset";
import { appFeedbackApi } from "../services/appFeedback";
import { campaignApi } from "../services/campaign";
import { rechargeNudgeApi } from "../services/rechargeNudge";
import { rechargeFunnelConfigApi } from "../services/rechargeFunnelConfig";
import { pushNudgeApi } from "../services/pushNudge";
import { blockedMobilesApi } from "../services/blockedMobiles";
import { notificationsApi } from "../services/notifications";
import { announcementApi } from "../services/announcements";
import { payoutApi } from "../services/payout";
import { salaryApi } from "../services/salary";
import { counsellorApi } from "../services/counsellor";
import { communityApi } from "../services/community";
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
    [monitoringApi.reducerPath]: monitoringApi.reducer,
    [systemResetApi.reducerPath]: systemResetApi.reducer,
    [appFeedbackApi.reducerPath]: appFeedbackApi.reducer,
    [campaignApi.reducerPath]: campaignApi.reducer,
    [rechargeNudgeApi.reducerPath]: rechargeNudgeApi.reducer,
    [rechargeFunnelConfigApi.reducerPath]: rechargeFunnelConfigApi.reducer,
    [pushNudgeApi.reducerPath]: pushNudgeApi.reducer,
    [blockedMobilesApi.reducerPath]: blockedMobilesApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [announcementApi.reducerPath]: announcementApi.reducer,
    [payoutApi.reducerPath]: payoutApi.reducer,
    [salaryApi.reducerPath]: salaryApi.reducer,
    [counsellorApi.reducerPath]: counsellorApi.reducer,
    [communityApi.reducerPath]: communityApi.reducer,
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
      monitoringApi.middleware,
      systemResetApi.middleware,
      appFeedbackApi.middleware,
      campaignApi.middleware,
      rechargeNudgeApi.middleware,
      rechargeFunnelConfigApi.middleware,
      pushNudgeApi.middleware,
      blockedMobilesApi.middleware,
      notificationsApi.middleware,
      announcementApi.middleware,
      payoutApi.middleware,
      salaryApi.middleware,
      counsellorApi.middleware,
      communityApi.middleware,
    ]),
});

setupListeners(store.dispatch);
