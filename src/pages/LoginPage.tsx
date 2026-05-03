import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ColorBends from '@/components/ColorBends'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { setUser } = useAuthStore()

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await window.playdesk.auth.login(username, password)
      if (res.success) setUser(res.user)
      else setError(res.error ?? 'Identifiants incorrects')
    } catch {
      setError('Erreur système')
    }
    setLoading(false)
  }

  return (
    <div className="h-screen bg-background flex items-center justify-center overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0">
        <ColorBends
          className="opacity-60"
          colors={['#ff5c7a', '#8a5cff', '#00ffd1']}
          rotation={90}
          speed={0.2}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={0.5}
          noise={0.15}
          parallax={0.5}
          iterations={1}
          intensity={1.5}
          bandWidth={6}
          transparent
          autoRotate={0}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xs mx-4 relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-sans text-4xl font-bold text-foreground tracking-[0.15em] uppercase">
            Play<span className="text-indigo-400">Desk</span>
          </h1>
          <p className="text-muted-foreground text-xs mt-1.5 tracking-widest">
            Connectez-vous pour continuer
          </p>
        </div>

        {/* Glass card */}
        <div
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{
            background:           'rgba(10, 10, 18, 0.35)',
            border:               '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter:       'blur(32px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
            boxShadow:            '0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Identifiant */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">
              Identifiant
            </label>
            <Input
              className='!bg-transparent border !border-white/10'
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
          </div>

          {/* Mot de passe */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">
              Mot de passe
            </label>
            <div className="relative">
              <Input
                className='!bg-transparent pr-10  border !border-white/10'
                value={password}
                onChange={e => setPassword(e.target.value)}
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors !outline-none !border-none bg-transparent p-0"
                tabIndex={-1}
              >
                {showPwd
                  ? <EyeOff className="w-3.5 h-3.5" />
                  : <Eye    className="w-3.5 h-3.5" />
                }
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg px-3 py-2.5"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border:     '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <p className="text-destructive text-xs text-center">{error}</p>
            </motion.div>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading || !username || !password}
            className="w-full mt-1"
          >
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connexion...</>
              : 'Se connecter'
            }
          </Button>
        </div>
      </motion.div>
    </div>
  )
}