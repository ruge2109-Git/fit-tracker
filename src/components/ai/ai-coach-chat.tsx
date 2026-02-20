'use client'

/**
 * AI Coach Chat — Floating chat panel
 * Gives users a conversational fitness coach powered by GPT-4o-mini
 * with access to their full workout history, goals, and measurements.
 */

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Loader2, ChevronDown, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  suggestions?: string[]
}

const SUGGESTED_PROMPTS = [
  '¿Estoy progresando bien?',
  '¿Qué músculo he trabajado más?',
  'Diseñame una rutina para esta semana',
  '¿Cuándo fue mi mejor semana de entrenamiento?',
]

export function AiCoachChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasIntroduced, setHasIntroduced] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Show welcome message when first opened
  useEffect(() => {
    if (isOpen && !hasIntroduced) {
      setHasIntroduced(true)
      setMessages([{
        role: 'assistant',
        content: '¡Hola! 👋 Soy tu coach IA personal. Tengo acceso a tu historial de entrenamientos, rutinas, metas y mediciones. ¿En qué puedo ayudarte hoy?',
      }])
    }
  }, [isOpen, hasIntroduced])

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || isLoading) return

    const userMessage: Message = { role: 'user', content: messageText }
    const updatedHistory = [...messages, userMessage]
    setMessages(updatedHistory)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: messages, // send full history for context
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Error al conectar con el coach')

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        suggestions: data.suggestions || [],
      }])
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${error.message || 'Hubo un problema al conectarme.'}`,
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = () => {
    setMessages([])
    setHasIntroduced(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* FAB — fully inline styles so PWA browsers can't override */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Abrir coach IA"
        style={{
          position: 'fixed',
          bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))',
          left: '16px',
          zIndex: 50,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: isOpen ? 'none' : '0 8px 32px rgba(139,92,246,0.45)',
          background: isOpen
            ? 'var(--muted)'
            : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
          color: isOpen ? 'var(--muted-foreground)' : '#fff',
          transform: isOpen ? 'scale(0.88)' : 'scale(1)',
          animation: isOpen ? 'none' : 'fabPulse 2.4s ease-in-out infinite',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <style>{`
          @keyframes fabPulse {
            0%,100% { box-shadow: 0 8px 32px rgba(139,92,246,0.45); }
            50%      { box-shadow: 0 8px 48px rgba(139,92,246,0.75), 0 0 0 8px rgba(139,92,246,0.12); }
          }
        `}</style>
        {isOpen
          ? <ChevronDown style={{ width: 24, height: 24, display: 'block' }} />
          : <Sparkles   style={{ width: 24, height: 24, display: 'block' }} />
        }
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-40 left-4 md:bottom-24 md:left-6 z-50',
          'w-[calc(100vw-2rem)] max-w-[380px]',
          'rounded-3xl border border-accent/20 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/20',
          'flex flex-col overflow-hidden',
          'transition-all duration-300 origin-bottom-right',
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-90 pointer-events-none',
        )}
        style={{ height: isOpen ? '520px' : '0' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-accent/10 bg-gradient-to-r from-violet-500/10 to-purple-700/5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-inner shadow-white/10">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-foreground">Coach IA</p>
              <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En línea · GPT-4o-mini
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Clear conversation */}
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                title="Nueva conversación"
                className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Bot className="h-3 w-3 text-white" />
                </div>
              )}

              {/* Bubble + chips stacked vertically */}
              <div className="flex flex-col gap-1.5 max-w-[85%]">
                <div
                  className={cn(
                    'rounded-2xl px-3 py-2 text-xs leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-br-sm font-medium'
                      : 'bg-accent/30 text-foreground rounded-bl-sm'
                  )}
                >
                  {msg.content}
                </div>

                {/* Suggestion chips — below the bubble, last AI message only */}
                {msg.role === 'assistant' && i === messages.length - 1 && msg.suggestions && msg.suggestions.length > 0 && !isLoading && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-accent/20 text-foreground/70 hover:bg-violet-500/15 hover:text-violet-600 dark:hover:text-violet-400 transition-all border border-accent/30 hover:border-violet-500/30 text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-2 justify-start animate-in fade-in duration-200">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center flex-shrink-0">
                <Bot className="h-3 w-3 text-white" />
              </div>
              <div className="bg-accent/30 rounded-2xl rounded-bl-sm px-3 py-2">
                <div className="flex gap-1 items-center h-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts (only when no messages except intro) */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 transition-colors border border-violet-500/20"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 items-end px-3 pb-3 pt-2 border-t border-accent/10 flex-shrink-0">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta..."
            className="flex-1 min-h-[36px] max-h-[100px] resize-none text-xs rounded-xl border-accent/20 bg-accent/5 focus-visible:ring-violet-500/30 focus-visible:ring-1 py-2 px-3"
            rows={1}
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 rounded-xl flex-shrink-0 bg-gradient-to-br from-violet-500 to-purple-700 hover:opacity-90 disabled:opacity-40 shadow-md shadow-violet-500/20"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
