import {
  // nav
  Compass, CalendarCheck, MapPin, User, LayoutDashboard, Briefcase, Radar, ShieldCheck,
  Wallet, GraduationCap, FileText, Users, UserPlus, ScrollText, CalendarClock, CalendarOff, Banknote,
  // service categories
  Sparkles, Zap, Wrench, Scissors, ChefHat, HeartHandshake, PaintRoller,
  // skills, chat, search
  Award, Trophy, MessageCircle, Search,
  // safety / incidents
  Siren,
  // misc
  LayoutGrid, HelpCircle, type LucideIcon, type LucideProps,
} from 'lucide-react'

// Explicit registry — importing icons by name (not `import *`) keeps the bundle
// tree-shaken. Add new entries here when a data-driven config references them.
const REGISTRY: Record<string, LucideIcon> = {
  Compass, CalendarCheck, MapPin, User, LayoutDashboard, Briefcase, Radar, ShieldCheck,
  Wallet, GraduationCap, FileText, Users, UserPlus, ScrollText, CalendarClock, CalendarOff, Banknote,
  Sparkles, Zap, Wrench, Scissors, ChefHat, HeartHandshake, PaintRoller,
  Award, Trophy, MessageCircle, Search, Siren,
  LayoutGrid,
}

/** Render a lucide icon by its string name (used for data-driven configs). */
export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = REGISTRY[name] ?? HelpCircle
  return <Cmp {...props} />
}
