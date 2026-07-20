import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/misc'

export function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <PageHeader title={title} subtitle="Part of the Lighthouse platform" />
      <EmptyState
        icon={<Construction className="h-7 w-7" />}
        title={`${title} — arriving in ${phase}`}
        description="The foundation is live. This module will be built out in an upcoming phase, wired to the shared database and design system already in place."
      />
    </div>
  )
}
