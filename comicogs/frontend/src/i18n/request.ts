import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // For now, we'll default to English
  // In the future, this could read from cookies or user preferences
  const locale = "en";

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
