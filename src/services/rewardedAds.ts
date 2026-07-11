import { Platform } from "react-native";
import Constants from "expo-constants";

export type RewardedAdResult =
  | { status: "earned" }
  | { status: "closed" }
  | { status: "failed"; message: string }
  | { status: "unavailable"; message: string };

const PRODUCTION_ANDROID_REWARDED_UNIT_ID =
  process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID_UNIT_ID ?? "ca-app-pub-7306915590865813/8028970731";
const PRODUCTION_IOS_REWARDED_UNIT_ID =
  process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS_UNIT_ID ?? "ca-app-pub-3940256099942544/1712485313";

// Google official test rewarded ad units — always fill during development.
const TEST_ANDROID_REWARDED_UNIT_ID = "ca-app-pub-3940256099942544/5224354917";
const TEST_IOS_REWARDED_UNIT_ID = "ca-app-pub-3940256099942544/1712485313";

const LOAD_TIMEOUT_MS = 25000;

type RewardedAdModule = typeof import("react-native-google-mobile-ads");
type RewardedAdInstance = ReturnType<RewardedAdModule["RewardedAd"]["createForAdRequest"]>;

let adsModule: RewardedAdModule | null | undefined;
let initialized = false;

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

function useProductionAdsInDev(): boolean {
  return process.env.EXPO_PUBLIC_ADMOB_USE_PRODUCTION_ADS === "true";
}

/** Dev Client uses test ads by default; real AdMob units often have no fill before app review. */
export function getRewardedAdUnitId(): string {
  const productionId = Platform.select({
    ios: PRODUCTION_IOS_REWARDED_UNIT_ID,
    android: PRODUCTION_ANDROID_REWARDED_UNIT_ID,
    default: PRODUCTION_ANDROID_REWARDED_UNIT_ID
  }) as string;

  if (__DEV__ && !useProductionAdsInDev()) {
    return Platform.select({
      ios: TEST_IOS_REWARDED_UNIT_ID,
      android: TEST_ANDROID_REWARDED_UNIT_ID,
      default: TEST_ANDROID_REWARDED_UNIT_ID
    }) as string;
  }

  return productionId;
}

export function isUsingTestRewardedAds(): boolean {
  return __DEV__ && !useProductionAdsInDev();
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
}

function loadRewardedAd(adUnitId: string): Promise<RewardedAdInstance> {
  const mod = getAdsModule();
  if (!mod) {
    return Promise.reject(new Error("ads_module_missing"));
  }

  const { RewardedAd, RewardedAdEventType, AdEventType } = mod;

  return new Promise((resolve, reject) => {
    const ad = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false
    });
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      ad.removeAllListeners();
      reject(new Error("ad_load_timeout"));
    }, LOAD_TIMEOUT_MS);

    const finish = (handler: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      ad.removeAllListeners();
      handler();
    };

    ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      finish(() => resolve(ad));
    });

    ad.addAdEventListener(AdEventType.ERROR, (error) => {
      finish(() => reject(new Error(error.message || "ad_load_error")));
    });

    ad.load();
  });
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

  const adUnitId = getRewardedAdUnitId();
  const { RewardedAdEventType, AdEventType } = mod;

  try {
    const ad = await loadRewardedAd(adUnitId);

    return await new Promise<RewardedAdResult>((resolve) => {
      let earned = false;
      let settled = false;

      const finish = (result: RewardedAdResult) => {
        if (settled) {
          return;
        }
        settled = true;
        ad.removeAllListeners();
        resolve(result);
      };

      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      });

      ad.addAdEventListener(AdEventType.CLOSED, () => {
        finish(earned ? { status: "earned" } : { status: "closed" });
      });

      ad.addAdEventListener(AdEventType.ERROR, (error) => {
        finish({ status: "failed", message: error.message || "ad_show_error" });
      });

      ad.show().catch((error: Error) => {
        finish({ status: "failed", message: error.message || "show_failed" });
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ad_load_error";

    // If production unit fails in dev, retry once with Google test ads.
    if (__DEV__ && useProductionAdsInDev() && adUnitId !== TEST_ANDROID_REWARDED_UNIT_ID) {
      try {
        const fallbackAd = await loadRewardedAd(TEST_ANDROID_REWARDED_UNIT_ID);
        return await new Promise<RewardedAdResult>((resolve) => {
          let earned = false;
          let settled = false;
          const finish = (result: RewardedAdResult) => {
            if (!settled) {
              settled = true;
              fallbackAd.removeAllListeners();
              resolve(result);
            }
          };
          fallbackAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
            earned = true;
          });
          fallbackAd.addAdEventListener(AdEventType.CLOSED, () => {
            finish(earned ? { status: "earned" } : { status: "closed" });
          });
          fallbackAd.addAdEventListener(AdEventType.ERROR, (e) => {
            finish({ status: "failed", message: e.message || message });
          });
          fallbackAd.show().catch((e: Error) => finish({ status: "failed", message: e.message }));
        });
      } catch {
        return { status: "failed", message };
      }
    }

    return { status: "failed", message };
  }
}
