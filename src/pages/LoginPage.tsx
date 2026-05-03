import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { Loader2, Gamepad2, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [username, setUsername]   = useState('')
  const [password, setPassword]   = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
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
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xs mx-4 relative"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15 border border-primary/25 mb-4">
            <Gamepad2 className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-sans text-2xl font-bold text-foreground tracking-[0.15em] uppercase">
            Play<span className="text-primary">Desk</span>
          </h1>
          <p className="text-muted-foreground text-xs mt-1.5 tracking-widest">Connectez-vous pour continuer</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4 shadow-2xl">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">Identifiant</label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">Mot de passe</label>
            <div className="relative">
              <Input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPwd
                  ? <EyeOff className="w-3.5 h-3.5" />
                  : <Eye    className="w-3.5 h-3.5" />
                }
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2.5"
            >
              <p className="text-destructive text-xs text-center">{error}</p>
            </motion.div>
          )}

          <Button onClick={handleLogin} disabled={loading || !username || !password} className="w-full mt-1">
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connexion...</> : 'Se connecter'}
          </Button>

          <p className="text-muted-foreground/60 text-[10px] text-center tracking-wide">
            Par défaut : <span className="text-muted-foreground font-mono">admin</span> / <span className="text-muted-foreground font-mono">admin123</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}