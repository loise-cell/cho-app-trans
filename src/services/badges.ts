import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "choapptrans.badges.v1";

export type BadgeId = "super_lucky_translator";

export type BadgeRecord = {
  id: BadgeId;
  unlockedAt: string;
};

export type BadgesState = {
  records: BadgeRecord[];
};

export const SUPER_LUCKY_TRANSLATOR_BADGE: BadgeId = "super_lucky_translator";

export const defaultBadgesState: BadgesState = {
  records: []
};

export async function loadBadgesState(): Promise<BadgesState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaultBadgesState };
    }
    const parsed = JSON.parse(raw) as Partial<BadgesState>;
    return {
      records: Array.isArray(parsed.records) ? parsed.records : []
    };
  } catch {
    return { ...defaultBadgesState };
  }
}

export async function saveBadgesState(state: BadgesState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function hasBadge(state: BadgesState, id: BadgeId): boolean {
  return state.records.some((item) => item.id === id);
}

export async function unlockBadge(state: BadgesState, id: BadgeId): Promise<{ state: BadgesState; isNew: boolean }> {
  if (hasBadge(state, id)) {
    return { state, isNew: false };
  }
  const next: BadgesState = {
    records: [...state.records, { id, unlockedAt: new Date().toISOString() }]
  };
  await saveBadgesState(next);
  return { state: next, isNew: true };
}
