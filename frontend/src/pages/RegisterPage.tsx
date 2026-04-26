import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'

function RegisterPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    try {
      await api.post('/auth/register', { username, password })
      navigate('/login')
    } catch (err: any) {
      setError(err?.response?.data?.message || '注册失败，请检查输入信息')
    }
  }

  return (
    <section>
      <h2>注册</h2>
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
        <button type="submit">注册</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        已有账号？<Link to="/login">去登录</Link>
      </p>
    </section>
  )
}

export default RegisterPage
