interface RocketRowProps {
  /** Bit indices (0–7) currently firing rockets */
  firingIndices: number[]
}

export function RocketRow({ firingIndices }: RocketRowProps) {
  return (
    <div className="rocket-row grid grid-cols-8 gap-0.5 sm:gap-1 h-6 sm:h-8 mb-0.5" aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="relative flex justify-center items-end">
          {firingIndices.includes(i) && (
            <div className="rocket-launch absolute bottom-0 flex flex-col items-center">
              <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-gradient-to-t from-[#ffe566] via-[#ff9f43] to-transparent" />
              <div className="w-2 sm:w-3 h-2 sm:h-3 bg-[#b2bec3] border border-[#636e72] rotate-45" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
