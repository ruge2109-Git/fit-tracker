'use client'

import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dumbbell, 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  Target, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Users,
  Clock,
  Award,
  Crown,
  Sparkles,
  Star
} from 'lucide-react'
import { ROUTES, APP_NAME } from '@/lib/constants'
import { LanguageSelector } from '@/components/language/language-selector'
import { ThemeToggle } from '@/components/providers/theme-toggle'

interface LandingPageProps {
  locale: string
}

export function LandingPage({ locale }: LandingPageProps) {
  const router = useRouter()
  const t = useTranslations('landing')

  const features = [
    {
      icon: Dumbbell,
      title: t('features.trackWorkouts'),
      description: t('features.trackWorkoutsDesc'),
    },
    {
      icon: BarChart3,
      title: t('features.analyzeProgress'),
      description: t('features.analyzeProgressDesc'),
    },
    {
      icon: Calendar,
      title: t('features.routinePlanning'),
      description: t('features.routinePlanningDesc'),
    },
    {
      icon: TrendingUp,
      title: t('features.visualizeData'),
      description: t('features.visualizeDataDesc'),
    },
    {
      icon: Target,
      title: t('features.setGoals'),
      description: t('features.setGoalsDesc'),
    },
    {
      icon: Zap,
      title: t('features.offlineMode'),
      description: t('features.offlineModeDesc'),
    },
  ]

  const benefits = [
    t('benefits.trackProgress'),
    t('benefits.stayMotivated'),
    t('benefits.planWorkouts'),
    t('benefits.analyzeData'),
    t('benefits.achieveGoals'),
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <ThemeToggle />
            <Button onClick={() => router.push(ROUTES.AUTH)} variant="default">
              {t('getStarted')}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              onClick={() => router.push(ROUTES.AUTH)}
              className="text-lg px-8"
            >
              {t('hero.cta')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="text-lg px-8"
            >
              {t('hero.learnMore')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">{t('features.title')}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">{t('benefits.title')}</h2>
              <p className="text-xl text-muted-foreground">
                {t('benefits.subtitle')}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-background rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <Users className="h-12 w-12 text-primary mx-auto" />
            <h3 className="text-3xl font-bold">10K+</h3>
            <p className="text-muted-foreground">{t('stats.users')}</p>
          </div>
          <div className="space-y-2">
            <Clock className="h-12 w-12 text-primary mx-auto" />
            <h3 className="text-3xl font-bold">50K+</h3>
            <p className="text-muted-foreground">{t('stats.workouts')}</p>
          </div>
          <div className="space-y-2">
            <Award className="h-12 w-12 text-primary mx-auto" />
            <h3 className="text-3xl font-bold">100K+</h3>
            <p className="text-muted-foreground">{t('stats.sets')}</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('pricing.title')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>{t('pricing.free.name')}</CardTitle>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{t('pricing.free.price')}</span>
                </div>
                <CardDescription className="mt-2">
                  {t('pricing.free.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {t.raw('pricing.free.features').map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full mt-6"
                  onClick={() => router.push(ROUTES.AUTH)}
                >
                  {t('pricing.getStarted')}
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan - Featured */}
            <Card className="relative border-2 border-primary shadow-lg scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  {t('pricing.pro.popular')}
                </span>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>{t('pricing.pro.name')}</CardTitle>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{t('pricing.pro.price')}</span>
                  <span className="text-muted-foreground">/{t('pricing.perMonth')}</span>
                </div>
                <CardDescription className="mt-2">
                  {t('pricing.pro.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {t.raw('pricing.pro.features').map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full mt-6"
                  onClick={() => router.push(ROUTES.AUTH)}
                >
                  {t('pricing.upgrade')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="relative">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <CardTitle>{t('pricing.premium.name')}</CardTitle>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{t('pricing.premium.price')}</span>
                  <span className="text-muted-foreground">/{t('pricing.perMonth')}</span>
                </div>
                <CardDescription className="mt-2">
                  {t('pricing.premium.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {t.raw('pricing.premium.features').map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full mt-6"
                  onClick={() => router.push(ROUTES.AUTH)}
                >
                  {t('pricing.upgrade')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            {t('pricing.note')}
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-4xl font-bold">{t('cta.title')}</h2>
            <p className="text-xl opacity-90">
              {t('cta.subtitle')}
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => router.push(ROUTES.AUTH)}
              className="text-lg px-8 mt-4"
            >
              {t('cta.button')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. {t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  )
}

