'use client'

import dynamic from 'next/dynamic'

// Dynamically import Toaster with ssr: false to prevent hydration issues
// caused by browser extensions modifying the DOM
const Toaster = dynamic(
  () => import('@/components/ui/toaster').then((mod) => mod.Toaster),
  { ssr: false }
)

export function ClientToaster() {
  return <Toaster />
}
