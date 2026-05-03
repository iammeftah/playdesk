export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex-1 overflow-auto p-6"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      {children}
    </div>
  )
}