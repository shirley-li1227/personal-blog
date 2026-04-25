import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/'
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    try {
      const { data } = await api.post('/auth/login', { username, password })
      login({ token: data.token, user: data.user })
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message || '登录失败，请检查用户名或密码')
    }
  }

  return (
    <section>
      <h2>登录</h2>
      <form className="form" onSubmit={onSubmit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="用户名"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码"
        />
        <button type="submit">登录</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        还没有账号？<Link to="/register">去注册</Link>
      </p>
    </section>
  )
}

export default LoginPage
