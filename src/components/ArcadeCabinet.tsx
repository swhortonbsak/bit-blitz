import type { ReactNode } from 'react'

interface ArcadeCabinetProps {
  children: ReactNode
  shake?: boolean
}

/** CRT-style arcade cabinet — playfield dominates vertical space */
export function ArcadeCabinet({ children, shake }: ArcadeCabinetProps) {
  return (
    <div
      className={`arcade-cabinet-wrap min-h-dvh flex justify-center p-1 sm:p-2 ${shake ? 'screen-shake' : ''}`}
    >
      <div className="arcade-cabinet w-full max-w-2xl flex flex-col min-h-[96dvh] max-h-[100dvh] shadow-[0_0_40px_#0008]">
        <div className="cabinet-bezel-top h-2 sm:h-3 bg-[#2d3436] border-4 border-[#636e72] rounded-t-lg shrink-0" />
        <div className="cabinet-screen flex flex-col flex-1 min-h-0 bg-[#0d1b2a] border-x-6 sm:border-x-8 border-[#2d3436] overflow-hidden relative">
          <div className="crt-overlay" aria-hidden />
          <div className="relative z-10 flex flex-col flex-1 min-h-0 cabinet-layout">{children}</div>
        </div>
        <div className="cabinet-bezel-bottom h-4 sm:h-5 bg-[#3d2914] border-4 border-[#5c3d2e] rounded-b-lg shrink-0" />
      </div>
    </div>
  )
}
