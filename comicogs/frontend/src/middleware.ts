// Temporarily disabled next-intl middleware to fix routing issues
// import createMiddleware from "next-intl/middleware";

// export default createMiddleware({
//   // A list of all locales that are supported
//   locales: ["en"],
//   
//   // Used when no locale matches
//   defaultLocale: "en",
//   
//   // Don't add locale prefix for default locale
//   localePrefix: "never"
// });

// Simple middleware that does nothing - just passes through all requests
export function middleware() {
  // Do nothing, let Next.js handle routing normally
  return;
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    "/((?!api|_next|_vercel|.*\\..*).*)"
  ]
};
