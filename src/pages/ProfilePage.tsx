import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { ShieldCheck, Eye, EyeOff, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'

const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <rect width="40" height="40" rx="10" fill="#1e2035"/>
    <circle cx="20" cy="15" r="7" fill="#3d4068"/>
    <path d="M6 36c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="#3d4068"/>
  </svg>`
)}`

export default function ProfilePage() {
  const { user } = useAuthStore()

  // ── Avatar ────────────────────────────────────────────────────────────────
  const [avatar,      setAvatar]      = useState<string>(DEFAULT_AVATAR)
  const [avatarError, setAvatarError] = useState('')
  const [avatarSaving, setAvatarSaving] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    window.playdesk.users.getAvatar(user.id).then(res => {
      if (res.avatar) setAvatar(res.avatar)
    })
  }, [user?.id])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    // Reset input so same file can be re-selected
    e.target.value = ''

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image trop grande (max 2 Mo)')
      return
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setAvatarError('Format accepté : PNG, JPEG, WebP')
      return
    }

    setAvatarError('')
    setAvatarSaving(true)

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      const res = await window.playdesk.users.setAvatar(user.id, base64)
      if (res.success) {
        setAvatar(base64)
        // Notify sidebar to update avatar
        window.dispatchEvent(new CustomEvent('playdesk:avatar-updated', { detail: base64 }))
      } else {
        setAvatarError(res.error ?? 'Erreur lors de l\'upload')
      }
      setAvatarSaving(false)
    }
    reader.onerror = () => {
      setAvatarError('Impossible de lire le fichier')
      setAvatarSaving(false)
    }
    reader.readAsDataURL(file)
  }

  const handleResetAvatar = async () => {
    if (!user?.id) return
    setAvatarSaving(true)
    const res = await window.playdesk.users.setAvatar(user.id, '')
    if (res.success) {
      setAvatar(DEFAULT_AVATAR)
      window.dispatchEvent(new CustomEvent('playdesk:avatar-updated', { detail: DEFAULT_AVATAR }))
    }
    setAvatarSaving(false)
  }

  // ── Password ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  })

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const resetForm = () => setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const handleSave = async () => {
    setError('')
    setSuccess(false)

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError('Tous les champs sont requis.')
      return
    }
    if (form.newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Les deux nouveaux mots de passe ne correspondent pas.')
      return
    }
    if (form.newPassword === form.currentPassword) {
      setError('Le nouveau mot de passe doit être différent de l\'actuel.')
      return
    }

    setLoading(true)
    const res = await window.playdesk.users.changePassword({
      currentPassword: form.currentPassword,
      newPassword:     form.newPassword,
    })
    setLoading(false)

    if (res.success) {
      setSuccess(true)
      resetForm()
    } else {
      setError(res.error ?? 'Erreur lors de la mise à jour.')
    }
  }

  const isDefaultAvatar = avatar === DEFAULT_AVATAR

  return (
    <div
      className="flex-1 overflow-auto p-6"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="max-w-lg"
      >
        {/* ── Page header ── */}
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Mon profil
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Informations de votre compte et sécurité
          </p>
        </div>

        {/* ── Identity + Avatar card ── */}
        <div
          className="rounded-xl p-5 mb-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-5">

            {/* Avatar with upload overlay */}
            <div className="relative group shrink-0">
              <div
                className="w-16 h-16 rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  boxShadow: avatarSaving
                    ? '0 0 0 2px var(--neon), 0 0 10px rgba(99,102,241,0.35)'
                    : '0 0 0 1.5px var(--border)',
                }}
              >
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  style={{ opacity: avatarSaving ? 0.5 : 1, transition: 'opacity 0.2s' }}
                />
              </div>

              {/* Saving spinner overlay */}
              {avatarSaving && (
                <div className="absolute inset-0 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.45)' }}
                >
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                  </svg>
                </div>
              )}

              {/* Upload hover overlay */}
              {!avatarSaving && (
                <label
                  className="absolute inset-0 rounded-xl flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(0,0,0,0.60)' }}
                  title="Changer l'avatar"
                >
                  <Camera className="w-4 h-4 text-white mb-0.5" />
                  <span className="text-[9px] text-white font-medium tracking-wide">Modifier</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>

            {/* Identity info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                {user?.username}
              </p>
              <span
                className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${
                  user?.role === 'admin'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                }`}
              >
                {user?.role}
              </span>

              {/* Avatar feedback */}
              {avatarError && (
                <p className="text-[11px] text-red-500 dark:text-red-400 mt-1.5">{avatarError}</p>
              )}

              {/* Reset avatar link */}
              {!isDefaultAvatar && !avatarSaving && (
                <button
                  onClick={handleResetAvatar}
                  className="text-[11px] mt-1.5 transition-colors block"
                  style={{ color: 'var(--muted-foreground)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--foreground)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground)'}
                >
                  Réinitialiser l'avatar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Change password ── */}
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {/* Section header */}
          <div
            className="flex items-center gap-2.5 mb-5 pb-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--neon-dim)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--neon)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none" style={{ color: 'var(--foreground)' }}>
                Changer le mot de passe
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Seul vous pouvez modifier votre mot de passe
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">

            {/* Current password */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={form.currentPassword}
                  onChange={e => { setForm(f => ({ ...f, currentPassword: e.target.value })); setError(''); setSuccess(false) }}
                  placeholder="Votre mot de passe actuel"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={e => { setForm(f => ({ ...f, newPassword: e.target.value })); setError(''); setSuccess(false) }}
                  placeholder="6 caractères minimum"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm new password */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Confirmer le nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => { setForm(f => ({ ...f, confirmPassword: e.target.value })); setError(''); setSuccess(false) }}
                  placeholder="Répétez le nouveau mot de passe"
                  className="pr-9"
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Feedback */}
            {error && (
              <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
            )}
            {success && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Mot de passe mis à jour avec succès.
              </p>
            )}

            <div className="flex justify-end pt-1">
              <Button onClick={handleSave} disabled={loading} size="sm">
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  )
}