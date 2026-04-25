import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <section>
      <h2>个人中心</h2>
      <p>用户名：{user?.username}</p>
      <p>邮箱：{user?.email}</p>
      <button
        type="button"
        onClick={() => {
          logout()
          navigate('/login')
        }}
      >
        退出登录
      </button>
    </section>
  )
}

export default ProfilePage
