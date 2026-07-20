import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/ui/Button'

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <Logo />
      <p className="mt-8 text-7xl font-extrabold text-brand-900">404</p>
      <h1 className="mt-2 text-xl font-bold text-slate-800">Page not found</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/" className="mt-6">
        <Button icon={<Compass className="h-4 w-4" />}>Back to home</Button>
      </Link>
    </div>
  )
}
