import AsyncStorage from "@react-native-async-storage/async-storage";
import { PointsState, getLocalDateString, initialPointsState, refreshDailyAdCount } from "./pointsLedger";

const STORAGE_KEY = "choapptrans.points.v1";

function normalizePointsState(raw: Partial<PointsState> | null | undefined): PointsState {
  if (!raw) {
    return { ...initialPointsState };
  }
  return {
    points: typeof raw.points === "number" && Number.isFinite(raw.points) ? Math.max(0, Math.floor(raw.points)) : 0,
    totalAdsWatched:
      typeof raw.totalAdsWatched === "number" && Number.isFinite(raw.totalAdsWatched)
        ? Math.max(0, Math.floor(raw.totalAdsWatched))
        : 0,
    totalTranslations:
      typeof raw.totalTranslations === "number" && Number.isFinite(raw.totalTranslations)
        ? Math.max(0, Math.floor(raw.totalTranslations))
        : 0,
    adsWatchedToday:
      typeof raw.adsWatchedToday === "number" && Number.isFinite(raw.adsWatchedToday)
        ? Math.max(0, Math.floor(raw.adsWatchedToday))
        : 0,
    adsWatchDate: typeof raw.adsWatchDate === "string" && raw.adsWatchDate.trim() ? raw.adsWatchDate.trim() : getLocalDateString()
  };
}

export async function loadPointsState(): Promise<PointsState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...initialPointsState };
    }
    const normalized = normalizePointsState(JSON.parse(raw) as Partial<PointsState>);
    const refreshed = refreshDailyAdCount(normalized);
    if (refreshed.adsWatchedToday !== normalized.adsWatchedToday || refreshed.adsWatchDate !== normalized.adsWatchDate) {
      await savePointsState(refreshed);
      return refreshed;
    }
    return normalized;
  } catch {
    return { ...initialPointsState };
  }
}

export async function savePointsState(state: PointsState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizePointsState(state)));
}

/** Persist immediately — call after every points mutation. */
export async function commitPointsState(state: PointsState): Promise<PointsState> {
  const normalized = normalizePointsState(state);
  await savePointsState(normalized);
  return normalized;
}
