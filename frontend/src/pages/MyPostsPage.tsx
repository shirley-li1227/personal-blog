import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import type { Post } from '../types/post'
import { resolveMediaUrl } from '../utils/media'

function MyPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchMine() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/posts/mine')
        setPosts(data.list || [])
      } catch (err: any) {
        setError(err?.response?.data?.message || '获取我的发布失败')
      } finally {
        setLoading(false)
      }
    }
    fetchMine()
  }, [])

  if (loading) return <p>加载中...</p>
  if (error) return <p className="error">{error}</p>

  return (
    <section>
      <h2>我发布的</h2>
      {!posts.length && <p>暂无发布文章。</p>}
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
              点赞 {post.like_count} · 收藏 {post.favorite_count} · 浏览 {post.views}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default MyPostsPage
