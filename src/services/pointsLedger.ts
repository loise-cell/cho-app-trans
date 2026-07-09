const TRANSLATION_COST = 2;
const REWARD_PER_AD = 2;

export type PointsState = {
  points: number;
  totalAdsWatched: number;
  totalTranslations: number;
};

export const initialPointsState: PointsState = {
  points: 0,
  totalAdsWatched: 0,
  totalTranslations: 0
};

export const canTranslate = (state: PointsState): boolean => state.points >= TRANSLATION_COST;

export const rewardForAd = (state: PointsState): PointsState => ({
  ...state,
  points: state.points + REWARD_PER_AD,
  totalAdsWatched: state.totalAdsWatched + 1
});

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

export const constants = {
  TRANSLATION_COST,
  REWARD_PER_AD
};
