export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_VERSION = "v1.0.260317.010";

// Use local login page instead of Manus OAuth
export const getLoginUrl = () => {
  return "/login";
};
