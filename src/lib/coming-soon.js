/**
 * While this is true, visitors get the "coming soon" page instead of the blog
 * (src/proxy.js) and the main-site API returns no posts. /admin keeps working.
 *
 * It is on for the production deployment until BLOG_LAUNCHED=true is set in the
 * blog's Vercel project. Preview deployments and local runs always show the blog.
 */
export const COMING_SOON =
  process.env.VERCEL_ENV === "production" &&
  process.env.BLOG_LAUNCHED !== "true";
