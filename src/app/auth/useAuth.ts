import { useContext } from 'react'
import { AuthContext } from './authContext'

export function useAuth() {
  const state = useContext(AuthContext)
  if (!state) throw new Error('useAuth должен вызываться внутри AuthProvider')
  return state
}
