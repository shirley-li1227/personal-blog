import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { Post } from '../types/post'
import { resolveMediaUrl } from '../utils/media'

function IconHeart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-svg">
      <path
        d="M12 21s-6.7-4.4-9.3-8C.6 10.1 1.6 5.9 5.3 4.7c2-.7 4.2-.1 5.7 1.5 1.5-1.6 3.8-2.2 5.7-1.5 3.8 1.2 4.8 5.4 2.6 8.3C18.7 16.6 12 21 12 21z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function IconBookmark({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-svg">
      <path
        d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function PostDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/posts/${id}`)
        setPost(data.post)
      } catch (err: any) {
        setError(err?.response?.data?.message || '获取文章详情失败')
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [id])

  async function handleDelete() {
    if (!id) return
    const confirmed = window.confirm('确认删除这篇文章吗？')
    if (!confirmed) return

    try {
      await api.delete(`/posts/${id}`)
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.message || '删除失败')
    }
  }

  async function handleToggleLike() {
    if (!id || !post) return
    try {
      const { data } = post.liked
        ? await api.delete(`/posts/${id}/like`)
        : await api.post(`/posts/${id}/like`)
      setPost(data.post)
    } catch (err: any) {
      setError(err?.response?.data?.message || '操作失败')
    }
  }

  async function handleToggleFavorite() {
    if (!id || !post) return
    try {
      const { data } = post.favorited
        ? await api.delete(`/posts/${id}/favorite`)
        : await api.post(`/posts/${id}/favorite`)
      setPost(data.post)
    } catch (err: any) {
      setError(err?.response?.data?.message || '操作失败')
    }
  }

  async function handleTogglePublish() {
    if (!id || !post || !isOwner) return
    try {
      const { data } =
        post.status === 'published'
          ? await api.put(`/posts/${id}/unpublish`)
          : await api.put(`/posts/${id}/publish`)
      setPost(data.post)
    } catch (err: any) {
      setError(err?.response?.data?.message || '状态更新失败')
    }
  }

  if (loading) {
    return <p>加载中...</p>
  }

  if (error) {
    return <p className="error">{error}</p>
  }

  if (!post) {
    return <p>文章不存在</p>
  }

  const isOwner = user?.id === post.author.id

  return (
    <section>
      <h2>{post.title}</h2>
      <p className="meta-line">
        作者：{post.author.username} | 发布时间：
        {new Date(post.created_at).toLocaleString()} | 浏览：{post.views}
      </p>
      <p className="meta-line">
        状态：{post.status === 'published' ? '已发布' : '草稿/已下架'} | 点赞：
        {post.like_count} | 收藏：{post.favorite_count}
      </p>
      {post.cover && (
        <img className="post-cover" src={resolveMediaUrl(post.cover)} alt={post.title} />
      )}
      <p className="meta-line">分类：{post.category?.name || '未分类'}</p>
      {post.tags.length > 0 && (
        <p className="meta-line">标签：{post.tags.map((t) => `#${t}`).join(' ')}</p>
      )}
      <article className="markdown">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </article>
      {isAuthenticated && post.status === 'published' && (
        <div className="actions">
          <button type="button" className="icon-btn" onClick={handleToggleLike}>
            <IconHeart filled={post.liked} />
            <span>{post.liked ? '已点赞' : '点赞'}</span>
          </button>
          <button type="button" className="icon-btn" onClick={handleToggleFavorite}>
            <IconBookmark filled={post.favorited} />
            <span>{post.favorited ? '已收藏' : '收藏'}</span>
          </button>
        </div>
      )}
      {isOwner && (
        <div className="actions">
          <button type="button" onClick={handleTogglePublish}>
            {post.status === 'published' ? '下架文章' : '发布文章'}
          </button>
          <Link to={`/write/${post.id}`}>编辑</Link>
          <button type="button" className="danger" onClick={handleDelete}>
            删除
          </button>
        </div>
      )}
    </section>
  )
}

export default PostDetailPage
