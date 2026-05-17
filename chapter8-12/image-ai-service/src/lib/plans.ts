export const PLANS = {
  free: { label: "Free", monthlyTokenLimit: 10000 },
  pro: { label: "Pro", monthlyTokenLimit: 500000 },
} as const;

export const PLAN_MODELS = {
  free: "google/gemini-3-flash-preview",
  pro: "google/gemini-3.1-pro-preview",
} as const;

export const PLAN_IMAGE_MODELS = {
  free: "google/gemini-3.1-flash-image-preview",
  pro: "google/gemini-3-pro-image-preview",
} as const;

export type Plan = keyof typeof PLANS;

export function getMonthlyTokenLimit(plan: Plan): number {
  return PLANS[plan].monthlyTokenLimit;
}

export function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
