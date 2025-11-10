/**
 * Reset Password Page
 * Reset password with token from email
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authService } from '@/domain/services/auth.service'
import { ROUTES, APP_NAME } from '@/lib/constants'
import { Dumbbell, Eye, EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase/client'

type ResetPasswordFormData = {
  password: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const t = useTranslations('auth')

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

  const resetPasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('passwordMismatch'),
    path: ['confirmPassword'],
  })

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    // Check if we have a valid session/token from the reset link
    const checkSession = async () => {
      // First, check if there's a hash in the URL (token from email)
      const hash = window.location.hash
      
      if (hash) {
        // Parse the hash to extract the access token
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type')
        
        if (accessToken && type === 'recovery') {
          // Set the session using the token from the hash
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          })
          
          if (error || !data.session) {
            setIsValidToken(false)
            toast.error(t('invalidResetLinkDescription'))
            setTimeout(() => {
              router.push(ROUTES.FORGOT_PASSWORD)
            }, 2000)
          } else {
            setIsValidToken(true)
            // Clean up the hash from URL
            window.history.replaceState(null, '', window.location.pathname)
          }
        } else {
          setIsValidToken(false)
          toast.error(t('invalidResetLinkDescription'))
          setTimeout(() => {
            router.push(ROUTES.FORGOT_PASSWORD)
          }, 2000)
        }
      } else {
        // Check if we already have a session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setIsValidToken(true)
        } else {
          setIsValidToken(false)
          toast.error(t('invalidResetLinkDescription'))
          setTimeout(() => {
            router.push(ROUTES.FORGOT_PASSWORD)
          }, 2000)
        }
      }
    }

    checkSession()
  }, [router])

  const handleSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    
    const result = await authService.resetPassword(data.password)
    
    setIsLoading(false)
    
    if (result.error) {
      toast.error(t('passwordResetError'))
    } else {
      toast.success(t('passwordResetSuccess'))
      // Sign out to ensure clean state
      await authService.signOut()
      // Redirect to login
      router.push(ROUTES.AUTH)
    }
  }

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('invalidResetLink')}</CardTitle>
            <CardDescription>
              {t('invalidResetLinkDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => router.push(ROUTES.FORGOT_PASSWORD)}
            >
              {t('requestNewResetLink')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Dumbbell className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('resetPasswordTitle')}</CardTitle>
          <CardDescription>
            {t('resetPasswordDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('newPassword')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  {...form.register('password')}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  {...form.register('confirmPassword')}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('resetting') : t('resetPassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

