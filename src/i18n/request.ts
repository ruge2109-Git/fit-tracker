import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'
import { cookies } from 'next/headers'

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale

  // Try to get locale from cookie if not in path
  if (!locale || !routing.locales.includes(locale as any)) {
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
    if (cookieLocale && routing.locales.includes(cookieLocale as any)) {
      locale = cookieLocale
    } else {
      locale = routing.defaultLocale
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  }
})

