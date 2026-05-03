import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLicenseStore } from '../store/licenseStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function ActivationPage() {
  const [key, setKey]         = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { setActivated } = useLicenseStore()

  const handleActivate = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await window.playdesk.license.activate(key)
      if (res.success) {
        setSuccess(true)
        setTimeout(() => setActivated(true), 800)
      } else {
        setError(res.error ?? 'Erreur activation')
      }
    } catch {
      setError('Erreur système')
    }
    setLoading(false)
  }

  const handleKeyChange = (val: string) => {
    const clean = val.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 16)
    const parts  = clean.match(/.{1,4}/g) ?? []
    const prefix = parts[0] === 'PLAY' ? parts.join('-') : `PLAY-${parts.join('-')}`
    setKey(prefix)
  }

  return (
    <div className="h-screen bg-background flex items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm mx-4"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 shadow-[0_0_24px_hsl(var(--primary)/0.3)] mb-4 text-xl">
            🎮
          </div>
          <h1 className="font-sans text-2xl font-bold text-foreground tracking-tight">
            Play<span className="text-primary">Desk</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Activez votre licence pour continuer</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-[0_4px_24px_hsl(var(--background)/0.35)] flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Clé d'activation
            </label>
            <Input
              value={key}
              onChange={e => handleKeyChange(e.target.value)}
              placeholder="PLAY-XXXX-XXXX-XXXX"
              onKeyDown={e => e.key === 'Enter' && handleActivate()}
              className="font-mono text-center text-base tracking-widest"
            />
            <p className="text-[10px] text-muted-foreground/60 text-center">Format : PLAY-XXXX-XXXX-XXXX</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5"
            >
              <p className="text-destructive text-xs text-center">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              <p className="text-green-400 text-xs">Activation réussie !</p>
            </motion.div>
          )}

          <Button
            onClick={handleActivate}
            disabled={loading || !key || key.length < 19 || success}
            className="w-full"
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Activation...</>
            ) : success ? '✓ Activé' : 'Activer la licence'}
          </Button>

          <p className="text-muted-foreground/50 text-xs text-center">
            Contactez le support pour obtenir votre clé
          </p>
        </div>
      </motion.div>
    </div>
  )
}