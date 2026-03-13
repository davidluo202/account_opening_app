export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_VERSION = "v1.0.260313.007";

// Use local login page instead of Manus OAuth
export const getLoginUrl = () => {
  return "/login";
};
