// Standard industry list used across the application (individual occupation + corporate nature of business)
// Keep this list aligned whenever industry options change.

export const industryOptions = [
  "金融服務 / Financial Services",
  "資訊科技 / IT",
  "醫療保健 / Healthcare",
  "教育 / Education",
  "零售 / Retail",
  "製造業 / Manufacturing",
  "房地產 / Real Estate",
  "法律 / Legal",
  "會計 / Accounting",
  "其他 / Other",
] as const;

export type IndustryOption = (typeof industryOptions)[number];
