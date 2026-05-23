import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { soundEngine, type SoundName } from './soundEngine'

interface SoundContextValue {
  enabled: boolean
  toggle: () => boolean
  setEnabled: (v: boolean) => void
  unlock: () => void
  play: (name: SoundName) => void
}

const SoundContext = createContext<SoundContextValue | null>(null)

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(() => soundEngine.enabled)

  const setEnabled = useCallback((v: boolean) => {
    soundEngine.enabled = v
    setEnabledState(v)
  }, [])

  const toggle = useCallback((): boolean => {
    const next = soundEngine.toggle()
    setEnabledState(next)
    if (next) soundEngine.unlock()
    return next
  }, [])

  const unlock = useCallback(() => soundEngine.unlock(), [])

  const play = useCallback((name: SoundName) => {
    if (soundEngine.enabled) soundEngine.play(name)
  }, [])

  const value = useMemo(
    () => ({ enabled, toggle, setEnabled, unlock, play }),
    [enabled, toggle, setEnabled, unlock, play],
  )

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext)
  if (!ctx) throw new Error('useSound must be used within SoundProvider')
  return ctx
}
