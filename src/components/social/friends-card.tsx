/**
 * Friends List Card
 * Shows pending requests & accepted friends with premium PWA-optimized design
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, UserPlus, Check, X, Search, MessageCircle, Loader2 } from 'lucide-react'
import { communityService } from '@/domain/services/community.service'
import { Friendship } from '@/types'
import { useAuthStore } from '@/store/auth.store'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface FriendsCardProps {
  onOpenDM?: (friendId: string, nickname: string) => void
}

export function FriendsCard({ onOpenDM }: FriendsCardProps) {
  const t = useTranslations('social')
  const { user } = useAuthStore()
  const [friends, setFriends] = useState<Friendship[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; nickname: string; name: string }[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadFriends = useCallback(async () => {
    setIsLoading(true)
    const res = await communityService.getFriendships()
    if (res.data) setFriends(res.data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadFriends()
  }, [loadFriends])

  // Realtime friend request listener
  useEffect(() => {
    if (!user?.id) return
    const channel = communityService.subscribeToFriendRequests(user.id, () => {
      loadFriends()
      toast.info(t('newFriendRequest') || '¡Nueva solicitud de amistad!')
    })
    return () => { channel.unsubscribe() }
  }, [user?.id, loadFriends, t])

  const handleSearch = async () => {
    if (searchQuery.length < 2) return
    setIsSearching(true)
    const res = await communityService.searchUsers(searchQuery)
    if (res.data) setSearchResults(res.data)
    setIsSearching(false)
  }

  const sendRequest = async (friendId: string) => {
    const res = await communityService.sendFriendRequest(friendId)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(t('requestSent') || 'Solicitud enviada')
      setSearchResults(prev => prev.filter(u => u.id !== friendId))
      loadFriends()
    }
  }

  const respond = async (friendshipId: string, status: 'accepted' | 'rejected') => {
    const res = await communityService.respondToRequest(friendshipId, status)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(status === 'accepted' ? (t('requestAccepted') || '¡Ahora son amigos!') : (t('requestRejected') || 'Solicitud rechazada'))
      loadFriends()
    }
  }

  const pendingRequests = friends.filter(f => f.status === 'pending' && f.user_id_2 === user?.id)
  const pendingSent = friends.filter(f => f.status === 'pending' && f.user_id_1 === user?.id)
  const accepted = friends.filter(f => f.status === 'accepted')

  if (isLoading) {
    return (
      <Card className="rounded-3xl border-none bg-accent/5 animate-pulse">
        <div className="h-48 w-full" />
      </Card>
    )
  }

  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-gradient-to-b from-accent/10 to-background/50 border border-white/5">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          {t('friends') || 'Gym Buddies'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-6 space-y-6">

        {/* Search Users */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchUsers') || 'Buscar atletas...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-10 rounded-2xl h-12 bg-background/50 border-border/10 font-bold text-sm"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || searchQuery.length < 2}
              className="rounded-2xl h-12 px-6 font-black uppercase tracking-tighter text-xs"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              {searchResults.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl bg-background/40 border border-border/5">
                  <div>
                    <p className="font-black text-sm tracking-tight uppercase italic">{u.nickname || u.name}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendRequest(u.id)}
                    className="rounded-xl h-8 px-3 font-black uppercase text-[10px] tracking-wider gap-1"
                  >
                    <UserPlus className="h-3 w-3" />
                    {t('addFriend') || 'Agregar'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests Received */}
        {pendingRequests.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">{t('pendingRequests') || 'Solicitudes Pendientes'}</h3>
            {pendingRequests.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                <p className="font-black text-sm tracking-tight italic">{f.friend_nickname}</p>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => respond(f.id, 'accepted')}
                    className="h-8 w-8 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => respond(f.id, 'rejected')}
                    className="h-8 w-8 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending Sent */}
        {pendingSent.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">{t('sentRequests') || 'Solicitudes Enviadas'}</h3>
            {pendingSent.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-2xl bg-background/30 border border-border/5 opacity-60">
                <p className="font-bold text-sm tracking-tight italic">{f.friend_nickname}</p>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('pending') || 'Pendiente'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Accepted Friends */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{t('yourFriends') || 'Tus Amigos'} ({accepted.length})</h3>
          {accepted.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">
                {t('noFriendsYet') || 'Busca atletas y agrégalos'}
              </p>
            </div>
          ) : (
            accepted.map(f => (
              <div key={f.id} className="flex items-center justify-between p-4 rounded-2xl bg-background/40 border border-border/5 hover:bg-background/80 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm italic">
                    {(f.friend_nickname || 'A')[0].toUpperCase()}
                  </div>
                  <p className="font-black text-sm tracking-tight uppercase italic group-hover:text-primary transition-colors">
                    {f.friend_nickname}
                  </p>
                </div>
                {onOpenDM && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onOpenDM(f.friend_id!, f.friend_nickname!)}
                    className="h-10 w-10 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 active:scale-95"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
