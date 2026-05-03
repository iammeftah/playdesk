export default function Button({ children, onClick, variant = 'primary', disabled }: any) {
  const base = 'px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50'
  const variants: any = {
    primary: 'bg-brand-600 hover:bg-brand-500 text-white',
    ghost: 'bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white',
  }
  return <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]}`}>{children}</button>
}
