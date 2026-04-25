import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import type { Post } from '../types/post'
import { resolveMediaUrl } from '../utils/media'
import { useAuth } from '../contexts/AuthContext'

const PAGE_SIZE = 10

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

function HomePage() {
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const page = Number(searchParams.get('page') || '1')
  const category = searchParams.get('category') || ''
  const keyword = searchParams.get('keyword') || ''

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  )

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/posts', {
          params: {
            page,
            pageSize: PAGE_SIZE,
            category: category || undefined,
            keyword: keyword || undefined,
          },
        })
        setPosts(data.list || [])
        setTotal(data.total || 0)
      } catch (err: any) {
        setError(err?.response?.data?.message || '获取文章列表失败')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [page, category, keyword])

  const categoryTabs = useMemo(() => {
    const names = new Set<string>()
    posts.forEach((post) => {
      if (post.category?.name) {
        names.add(post.category.name)
      }
    })
    return ['全部', ...Array.from(names)]
  }, [posts])

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams)
    Object.entries(next).forEach(([key, value]) => {
      if (!value) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    if (!next.page) {
      params.set('page', '1')
    }
    setSearchParams(params)
  }

  async function toggleLike(post: Post) {
    try {
      const { data } = post.liked
        ? await api.delete(`/posts/${post.id}/like`)
        : await api.post(`/posts/${post.id}/like`)
      setPosts((prev) => prev.map((item) => (item.id === post.id ? data.post : item)))
    } catch (err: any) {
      setError(err?.response?.data?.message || '操作失败')
    }
  }

  async function toggleFavorite(post: Post) {
    try {
      const { data } = post.favorited
        ? await api.delete(`/posts/${post.id}/favorite`)
        : await api.post(`/posts/${post.id}/favorite`)
      setPosts((prev) => prev.map((item) => (item.id === post.id ? data.post : item)))
    } catch (err: any) {
      setError(err?.response?.data?.message || '操作失败')
    }
  }

  return (
    <section>
      <div className="toolbar">
        <input
          defaultValue={keyword}
          placeholder="搜索标题或内容"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParams({ keyword: e.currentTarget.value.trim(), page: '1' })
            }
          }}
        />
        <Link className="write-btn" to="/write">
          +写文章
        </Link>
      </div>
      <div className="category-tabs">
        {categoryTabs.map((tab) => {
          const value = tab === '全部' ? '' : tab
          const isActive = (category || '') === value
          return (
            <button
              key={tab}
              type="button"
              className={isActive ? 'tab active' : 'tab'}
              onClick={() => updateParams({ category: value, page: '1' })}
            >
              {tab}
            </button>
          )
        })}
      </div>
      {loading && <p>加载中...</p>}
      {error && <p className="error">{error}</p>}
      <ul className="card-list">
        {posts.map((post) => (
          <li key={post.id} className="card">
            <h3>
              <Link to={`/post/${post.id}`}>{post.title}</Link>
            </h3>
            {post.cover && (
              <img
                className="post-cover"
                src={resolveMediaUrl(post.cover)}
                alt={post.title}
              />
            )}
            <p className="meta-line">
              分类：{post.category?.name || '未分类'} | 作者：{post.author.username} |
              发布时间：{new Date(post.created_at).toLocaleString()}
            </p>
            <p>{post.content.slice(0, 120)}...</p>
            <div className="card-actions">
              <span className="view-count">浏览 {post.views}</span>
              {isAuthenticated && (
                <>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => {
                      void toggleLike(post)
                    }}
                  >
                    <IconHeart filled={post.liked} />
                    <span>{post.like_count}</span>
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => {
                      void toggleFavorite(post)
                    }}
                  >
                    <IconBookmark filled={post.favorited} />
                    <span>{post.favorite_count}</span>
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="pagination">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => updateParams({ page: String(page - 1) })}
        >
          上一页
        </button>
        <span>
          第 {Math.min(page, totalPages)} / {totalPages} 页（共 {total} 篇）
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => updateParams({ page: String(page + 1) })}
        >
          下一页
        </button>
      </div>
    </section>
  )
}

export default HomePage
