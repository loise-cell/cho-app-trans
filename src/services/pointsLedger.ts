const MIN_TRANSLATION_COST = 3;
/** Each full block of this many characters adds 1 point (on top of the minimum). */
const CHARS_PER_POINT = 50;
const REWARD_PER_AD = 1;
const JACKPOT_REWARD = 10;
const JACKPOT_CHANCE = 0.01;
const MEGA_JACKPOT_REWARD = 100;
const MEGA_JACKPOT_CHANCE = 0.0001;

export type PointsState = {
  points: number;
  totalAdsWatched: number;
  totalTranslations: number;
};

export type AdRewardTier = "normal" | "lucky" | "mega";

export type AdRewardResult = {
  state: PointsState;
  earned: number;
  tier: AdRewardTier;
};

/** @deprecated use tier === "lucky" || tier === "mega" */
export function isJackpotTier(tier: AdRewardTier): boolean {
  return tier === "lucky" || tier === "mega";
}

export const initialPointsState: PointsState = {
  points: 0,
  totalAdsWatched: 0,
  totalTranslations: 0
};

export function billableCharCount(text: string): number {
  return text.trim().length;
}

/** Points charged from OCR text length: min 3 pts, +1 pt per 50 characters (rounded up). */
export function translationCostForText(text: string): number {
  const chars = billableCharCount(text);
  if (chars === 0) {
    return MIN_TRANSLATION_COST;
  }
  return Math.max(MIN_TRANSLATION_COST, Math.ceil(chars / CHARS_PER_POINT));
}

export const canTranslate = (state: PointsState): boolean => state.points >= MIN_TRANSLATION_COST;

export function canTranslateWithCost(state: PointsState, cost: number): boolean {
  return state.points >= cost;
}

export function rewardForAd(state: PointsState): AdRewardResult {
  const roll = Math.random();
  let earned = REWARD_PER_AD;
  let tier: AdRewardTier = "normal";

  if (roll < MEGA_JACKPOT_CHANCE) {
    earned = MEGA_JACKPOT_REWARD;
    tier = "mega";
  } else if (roll < MEGA_JACKPOT_CHANCE + JACKPOT_CHANCE) {
    earned = JACKPOT_REWARD;
    tier = "lucky";
  }

  return {
    state: {
      ...state,
      points: state.points + earned,
      totalAdsWatched: state.totalAdsWatched + 1
    },
    earned,
    tier
  };
}

export function spendForTranslation(state: PointsState, cost: number): PointsState {
  if (!canTranslateWithCost(state, cost)) {
    throw new Error("點數不足，請先觀看廣告。");
  }

  return {
    ...state,
    points: state.points - cost,
    totalTranslations: state.totalTranslations + 1
  };
}

/** Short-text translations affordable at current balance (minimum tier only). */
export function translateCountAvailable(points: number): number {
  return Math.floor(points / MIN_TRANSLATION_COST);
}

export const constants = {
  MIN_TRANSLATION_COST,
  /** @deprecated use MIN_TRANSLATION_COST */
  TRANSLATION_COST: MIN_TRANSLATION_COST,
  CHARS_PER_POINT,
  REWARD_PER_AD,
  JACKPOT_REWARD,
  JACKPOT_CHANCE_PERCENT: Math.round(JACKPOT_CHANCE * 100),
  MEGA_JACKPOT_REWARD,
  MEGA_JACKPOT_CHANCE_PERCENT: 0.01
};
