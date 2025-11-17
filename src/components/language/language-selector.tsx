/**
 * Language Selector Component
 * Allows users to switch between available languages
 */

'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'
import { usePathname } from '@/i18n/routing'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Languages } from 'lucide-react'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
]

const LOCALE_STORAGE_KEY = 'preferred-locale'
const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'

export function LanguageSelector() {
  const locale = useLocale()
  const router = useNavigationRouter()
  const pathname = usePathname()

  // Load saved locale preference on mount (only once)
  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (savedLocale && savedLocale !== locale && ['en', 'es'].includes(savedLocale)) {
      // Also set cookie if not already set
      const existingCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${LOCALE_COOKIE_NAME}=`))
      
      if (!existingCookie) {
        document.cookie = `${LOCALE_COOKIE_NAME}=${savedLocale}; path=/; max-age=31536000; SameSite=Lax`
      }
      
      router.replace(pathname, { locale: savedLocale })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale !== locale) {
      // Save to localStorage
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
      
      // Save to cookie (for server-side access)
      document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
      
      router.replace(pathname, { locale: newLocale })
    }
  }

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  return (
    <Select value={locale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[120px] h-9">
        <div className="flex items-center gap-1.5">
          <Languages className="h-4 w-4" />
          <SelectValue>
            <span className="flex items-center gap-1.5 text-sm">
              <span className="text-base">{currentLanguage.flag}</span>
              <span className="hidden sm:inline">{currentLanguage.name}</span>
              <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
            </span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span className="text-base">{lang.flag}</span>
              <span>{lang.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

