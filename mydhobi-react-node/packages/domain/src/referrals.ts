export type ReferralProfile = {
  code: string;
  shareCount: number;
  successfulReferrals: number;
  rewardsEarned: number;
};
export type ReferralRecord = {
  id: string;
  code: string;
  referrerName: string;
  referrerMobile: string;
  friendName: string;
  friendMobile: string;
  status: "Pending" | "Applied" | "Rewarded";
  rewardAmount: number;
  createdAt: string;
  rewardedAt: string | null;
};
