import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAuthStore } from '../store/authStore'
import { Loader2, Eye, EyeOff, Sun, Moon, Power } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ColorBends from '@/components/ColorBends'

function getTheme(): 'dark' | 'light' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function applyTheme(theme: 'dark' | 'light') {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  localStorage.setItem('playdesk_theme', theme)
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [theme, setTheme]       = useState<'dark' | 'light'>(getTheme)
  const { setUser } = useAuthStore()

  const handleLogin = async () => {
    setLoading(true)
    try {
      const res = await window.playdesk.auth.login(username, password)
      if (res.success) {
        setUser(res.user)
      } else {
        toast.error(res.error ?? 'Identifiants incorrects')
      }
    } catch {
      toast.error('Erreur système')
    }
    setLoading(false)
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  const handleQuit = () => {
    window.playdesk.window.close()
  }

  return (
    <div className="h-screen bg-white dark:bg-black flex items-center justify-center overflow-hidden">
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
        <div className="rounded-2xl p-6 flex flex-col gap-4 backdrop-blur-2xl backdrop-saturate-150">
          {/* Identifiant */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">
              Identifiant
            </label>
            <Input
              className='!bg-transparent border !border-black/10 dark:!border-white/10'
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
                className='!bg-transparent pr-10 border !border-black/10 dark:!border-white/10'
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

          <Button
            onClick={handleLogin}
            disabled={loading || !username || !password}
            className="w-full mt-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connexion...</>
              : 'Se connecter'
            }
          </Button>
        </div>
      </motion.div>

      {/* ── Bottom-right corner controls ───────────────────────────── */}
      <div className="fixed bottom-4 right-4 flex gap-2 z-50">
        {/* Theme toggler */}
        <button
          className="p-2 text-neutral-800 dark:text-neutral-200 outline-none border-none"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {theme === 'dark'
            ? <Sun  size={15} />
            : <Moon size={15} />
          }
        </button>

        {/* Quit */}
        <button
          onClick={handleQuit}
          className="p-2 text-neutral-800 dark:text-neutral-200 outline-none border-none"
          title="Quitter PlayDesk"
        >
          <Power size={15} />
        </button>
      </div>
    </div>
  )
}