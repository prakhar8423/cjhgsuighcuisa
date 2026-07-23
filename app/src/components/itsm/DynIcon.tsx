import {
  AppWindow,
  Download,
  FileText,
  HelpCircle,
  KeyRound,
  Keyboard,
  Laptop,
  Mail,
  Monitor,
  Palette,
  ShieldCheck,
  UserPlus,
  Users,
  Wifi,
} from 'lucide-react'
import type { ComponentType } from 'react'

const MAP: Record<string, ComponentType<{ className?: string }>> = {
  AppWindow, Download, FileText, KeyRound, Keyboard, Laptop, Mail, Monitor,
  Palette, ShieldCheck, UserPlus, Users, Wifi,
}

export function DynIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? HelpCircle
  return <Icon className={className} />
}
