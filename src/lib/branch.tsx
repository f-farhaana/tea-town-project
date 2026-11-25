import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { branches, type Branch } from '../config/site'

type Ctx = { branch: Branch | null; setBranch: (b: Branch | null) => void }
const BranchCtx = createContext<Ctx>({ branch: null, setBranch: () => {} })
const KEY = 'tt-branch'

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branch, setB] = useState<Branch | null>(null)
  useEffect(() => {
    try { const id = localStorage.getItem(KEY); if (id) setB(branches.find((b) => b.id === id) ?? null) } catch { /* storage blocked */ }
  }, [])
  const setBranch = (b: Branch | null) => {
    setB(b)
    try { if (b) localStorage.setItem(KEY, b.id); else localStorage.removeItem(KEY) } catch { /* ignore */ }
  }
  return <BranchCtx.Provider value={{ branch, setBranch }}>{children}</BranchCtx.Provider>
}
export const useBranch = () => useContext(BranchCtx)
