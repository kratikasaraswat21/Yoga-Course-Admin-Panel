export const EnvConfig = {
  // VITE_ENVIRONMENT: "development" (default) or "production".
  CURRENT_ENVIRONMENT:
    String(import.meta.env.VITE_ENVIRONMENT ?? "development")
      .trim()
      .toLowerCase() === "production"
      ? "PRODUCTION"
      : "DEVELOPMENT",
  OWNER_NAME: "Kratika Saraswat",
  OWNER_MAIL: import.meta.env.VITE_OWNER_MAIL ?? "",
  // Public website, used for "Preview landing page" links.
  LANDING_SITE_URL: String(import.meta.env.VITE_LANDING_SITE_URL ?? "https://kratikayoga.com").replace(/\/$/, ""),
};
