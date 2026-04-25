import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearStoredUser,
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
  type AuthUser,
} from '../utils/auth'

type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (payload: { token: string; user: AuthUser }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [tokenState, setTokenState] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  const login = useCallback((payload: { token: string; user: AuthUser }) => {
    setToken(payload.token)
    setStoredUser(payload.user)
    setTokenState(payload.token)
    setUser(payload.user)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    clearStoredUser()
    setTokenState(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      token: tokenState,
      user,
      isAuthenticated: Boolean(tokenState),
      login,
      logout,
    }),
    [login, logout, tokenState, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
