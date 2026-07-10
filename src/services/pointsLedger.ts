const TRANSLATION_COST = 2;
const REWARD_PER_AD = 2;
const JACKPOT_REWARD = 10;
const JACKPOT_CHANCE = 0.02;
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

export const canTranslate = (state: PointsState): boolean => state.points >= TRANSLATION_COST;

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

export const spendForTranslation = (state: PointsState): PointsState => {
  if (!canTranslate(state)) {
    throw new Error("點數不足，請先觀看廣告。");
  }

  return {
    ...state,
    points: state.points - TRANSLATION_COST,
    totalTranslations: state.totalTranslations + 1
  };
};

export function translateCountAvailable(points: number): number {
  return Math.floor(points / TRANSLATION_COST);
}

export const constants = {
  TRANSLATION_COST,
  REWARD_PER_AD,
  JACKPOT_REWARD,
  JACKPOT_CHANCE_PERCENT: Math.round(JACKPOT_CHANCE * 100),
  MEGA_JACKPOT_REWARD,
  MEGA_JACKPOT_CHANCE_PERCENT: 0.01
};
