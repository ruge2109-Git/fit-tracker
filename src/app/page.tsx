import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

export default function Home() {
  // Redirect to default locale landing page
  redirect(`/${routing.defaultLocale}`)
}

