/**
 * Social Profile Settings Component
 * Allows users to opt-in to social features and set a nickname
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Globe, Users, Check, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/auth.store'
import { userService } from '@/domain/services/user.service'
import { toast } from 'sonner'

export function SocialProfileSettings() {
  const t = useTranslations('social')
  const { user, setUser } = useAuthStore()
  const [isPublic, setIsPublic] = useState(user?.is_public || false)
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const res = await userService.updateProfile(user.id, {
        is_public: isPublic,
        nickname: nickname.trim() || user.name
      })

      if (res.error) throw new Error(res.error)
      
      if (res.data) {
        // Update local user store
        setUser({
          ...user,
          is_public: res.data.is_public,
          nickname: res.data.nickname
        })
        toast.success(t('profileUpdated') || 'Perfil social actualizado')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el perfil')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="rounded-[2rem] border-none bg-accent/5 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-black uppercase tracking-tighter italic flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {t('socialProfile') || 'Perfil Social'}
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60 max-w-[200px]">
              {t('publicProfileDesc') || 'Muestra tu nombre y volumen en el ranking global.'}
            </CardDescription>
          </div>
          <Switch 
            checked={isPublic} 
            onCheckedChange={setIsPublic} 
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </CardHeader>
      
      {isPublic && (
        <CardContent className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">
              {t('nickname') || 'Apodo en Ranking'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t('nicknamePlaceholder') || 'Elige tu nombre de atleta...'}
                className="rounded-2xl bg-background/50 border-border/5 h-11 text-sm font-bold placeholder:opacity-30 placeholder:font-normal"
                maxLength={20}
              />
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="rounded-2xl h-11 px-5 font-black uppercase tracking-tighter text-xs"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
            <Users className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-blue-500/80 uppercase leading-relaxed tracking-tight">
              {t('privacyNote') || 'Aparecerás en el leaderboard con este nombre. Tus datos privados nunca se compartirán.'}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
