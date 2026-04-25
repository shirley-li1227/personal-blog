import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import type { Post } from '../types/post'
import { resolveMediaUrl } from '../utils/media'

function MyLikesPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchLiked() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/posts/liked')
        setPosts(data.list || [])
      } catch (err: any) {
        setError(err?.response?.data?.message || '获取我的点赞失败')
      } finally {
        setLoading(false)
      }
    }
    fetchLiked()
  }, [])

  if (loading) return <p>加载中...</p>
  if (error) return <p className="error">{error}</p>

  return (
    <section>
      <h2>我的点赞</h2>
      {!posts.length && <p>暂无点赞文章。</p>}
      <ul className="card-list">
        {posts.map((post) => (
          <li key={post.id} className="card">
            <h3>
              <Link to={`/post/${post.id}`}>{post.title}</Link>
            </h3>
            {post.cover && (
              <img className="post-cover" src={resolveMediaUrl(post.cover)} alt={post.title} />
            )}
            <p className="meta-line">
              作者：{post.author.username} · 收藏 {post.favorite_count}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default MyLikesPage
