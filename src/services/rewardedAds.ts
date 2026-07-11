import { Platform } from "react-native";
import Constants from "expo-constants";

export type RewardedAdResult =
  | { status: "earned" }
  | { status: "closed" }
  | { status: "failed"; message: string }
  | { status: "unavailable"; message: string };

const ANDROID_REWARDED_UNIT_ID =
  process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID_UNIT_ID ?? "ca-app-pub-7306915590865813/8028970731";
const IOS_REWARDED_UNIT_ID =
  process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS_UNIT_ID ?? "ca-app-pub-3940256099942544/1712485313";

const REWARDED_UNIT_ID = Platform.select({
  ios: IOS_REWARDED_UNIT_ID,
  android: ANDROID_REWARDED_UNIT_ID,
  default: ANDROID_REWARDED_UNIT_ID
}) as string;

type RewardedAdModule = typeof import("react-native-google-mobile-ads");

let adsModule: RewardedAdModule | null | undefined;
let initialized = false;
let preloadPromise: Promise<void> | null = null;

function getAdsModule(): RewardedAdModule | null {
  if (adsModule !== undefined) {
    return adsModule;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    adsModule = require("react-native-google-mobile-ads") as RewardedAdModule;
  } catch {
    adsModule = null;
  }
  return adsModule;
}

/** Native ads require a dev/production build; Expo Go uses a dev fallback when __DEV__. */
export function isNativeRewardedAdSupported(): boolean {
  return Constants.appOwnership !== "expo" && getAdsModule() !== null;
}

export async function initRewardedAds(): Promise<void> {
  if (!isNativeRewardedAdSupported()) {
    return;
  }
  const mod = getAdsModule();
  if (!mod || initialized) {
    return;
  }
  await mod.default().initialize();
  initialized = true;
  await preloadRewardedAd();
}

export async function preloadRewardedAd(): Promise<void> {
  if (!isNativeRewardedAdSupported()) {
    return;
  }
  if (preloadPromise) {
    return preloadPromise;
  }
  preloadPromise = new Promise<void>((resolve) => {
    const mod = getAdsModule();
    if (!mod) {
      resolve();
      return;
    }
    const { RewardedAd, RewardedAdEventType, AdEventType } = mod;
    const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID);
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      ad.removeAllListeners();
      preloadPromise = null;
    };
    ad.addAdEventListener(RewardedAdEventType.LOADED, onLoaded);
    ad.addAdEventListener(AdEventType.ERROR, onError);
    ad.load();
  });
  return preloadPromise;
}

export async function showRewardedAd(): Promise<RewardedAdResult> {
  if (!isNativeRewardedAdSupported()) {
    if (__DEV__) {
      return { status: "earned" };
    }
    return { status: "unavailable", message: "expo_go" };
  }

  const mod = getAdsModule();
  if (!mod) {
    return { status: "unavailable", message: "module_missing" };
  }

  await initRewardedAds();

  return new Promise<RewardedAdResult>((resolve) => {
    const { RewardedAd, RewardedAdEventType, AdEventType } = mod;
    const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID);
    let earned = false;
    let settled = false;

    const finish = (result: RewardedAdResult) => {
      if (settled) {
        return;
      }
      settled = true;
      ad.removeAllListeners();
      void preloadRewardedAd();
      resolve(result);
    };

    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });

    ad.addAdEventListener(AdEventType.CLOSED, () => {
      finish(earned ? { status: "earned" } : { status: "closed" });
    });

    ad.addAdEventListener(AdEventType.ERROR, (error) => {
      finish({ status: "failed", message: error.message || "ad_error" });
    });

    ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      ad.show().catch((error: Error) => {
        finish({ status: "failed", message: error.message || "show_failed" });
      });
    });

    ad.load();
  });
}
