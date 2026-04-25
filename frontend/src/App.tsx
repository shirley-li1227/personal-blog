import { Link, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PostDetailPage from './pages/PostDetailPage'
import WritePage from './pages/WritePage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FavoritesPage from './pages/FavoritesPage'
import MyPostsPage from './pages/MyPostsPage'
import MyLikesPage from './pages/MyLikesPage'
import ProtectedRoute from './routes/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'

function App() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <div className="layout">
      <header className="header">
        <h1>Snow的技术博客中心</h1>
        <nav>
          <Link to="/">首页</Link>
          {!isAuthenticated ? (
            <>
              <Link to="/login">登录</Link>
              <Link to="/register">注册</Link>
            </>
          ) : (
            <>
              <div className="profile-menu">
                <button type="button" className="plain-btn">
                  个人中心
                </button>
                <div className="profile-dropdown">
                  <Link to="/my-posts">我发布的</Link>
                  <Link to="/favorites">我的收藏</Link>
                  <Link to="/my-likes">我的点赞</Link>
                  <Link to="/profile">账户信息</Link>
                </div>
              </div>
              <span className="nav-user">Hi, {user?.username}</span>
              <button type="button" className="nav-logout" onClick={logout}>
                退出
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route
            path="/write"
            element={
              <ProtectedRoute>
                <WritePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/write/:id"
            element={
              <ProtectedRoute>
                <WritePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-posts"
            element={
              <ProtectedRoute>
                <MyPostsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-likes"
            element={
              <ProtectedRoute>
                <MyLikesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
