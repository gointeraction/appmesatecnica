'use client'

// Mesa Técnica de Criptoactivos - CAVECOM-e
// Plataforma de gestión de consultas técnicas
// This page uses client-side only rendering with ssr: false to prevent hydration issues

import dynamic from 'next/dynamic'

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-slate-700 rounded-2xl" />
        <div className="h-4 w-48 bg-slate-700 rounded" />
        <div className="h-3 w-32 bg-slate-700 rounded" />
      </div>
    </div>
  )
}

// Dynamically import the main app with SSR disabled
// This completely prevents hydration issues by ensuring the component
// only renders on the client side
const MesaTecnicaApp = dynamic(
  () => import('@/components/mesa-tecnica-app').then((mod) => mod.MesaTecnicaApp),
  { 
    ssr: false,
    loading: LoadingSkeleton
  }
)

export default function MesaTecnicaPage() {
  return <MesaTecnicaApp />
}
