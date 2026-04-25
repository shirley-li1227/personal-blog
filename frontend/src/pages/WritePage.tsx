import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../lib/api'
import type { Post } from '../types/post'
import { resolveMediaUrl } from '../utils/media'

function WritePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = Boolean(id)
  const [loading, setLoading] = useState(isEditMode)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [cover, setCover] = useState('')
  const [postStatus, setPostStatus] = useState<'draft' | 'published'>('draft')

  useEffect(() => {
    async function loadPost() {
      if (!id) return
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/posts/${id}`)
        const post: Post = data.post
        setTitle(post.title)
        setContent(post.content)
        setCategory(post.category?.name || '')
        setTags(post.tags.join(', '))
        setCover(post.cover || '')
        setPostStatus(post.status)
      } catch (err: any) {
        setError(err?.response?.data?.message || '加载文章失败')
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [id])

  const preview = useMemo(() => content || '请输入 Markdown 内容预览', [content])

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (postStatus !== 'published') {
        event.preventDefault()
        event.returnValue = '文章还没有发布，确定退出吗？'
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [postStatus])

  function handleBack() {
    if (postStatus !== 'published') {
      const confirmed = window.confirm('文章还没有发布，确定退出吗？')
      if (!confirmed) {
        return
      }
    }
    navigate(-1)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const payload = {
      title,
      content,
      category: category || null,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      cover: cover || null,
    }

    try {
      if (isEditMode) {
        await api.put(`/posts/${id}`, payload)
        navigate(`/post/${id}`)
      } else {
        const { data } = await api.post('/posts', payload)
        await api.put(`/posts/${data.post.id}/publish`)
        navigate('/')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '保存文章失败')
    }
  }

  if (loading) {
    return <p>加载中...</p>
  }

  return (
    <section>
      <div className="page-head">
        <button type="button" className="plain-btn" onClick={handleBack}>
          返回
        </button>
        <h2>{isEditMode ? '编辑文章' : '写文章'}</h2>
      </div>
      <form className="editor-grid" onSubmit={onSubmit}>
        <div className="editor-panel">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文章标题"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="分类（如：前端开发）"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="标签，逗号分隔"
          />
          <input
            value={cover}
            onChange={(e) => setCover(e.target.value)}
            placeholder="封面图 URL（可选）"
          />
          {cover && (
            <img className="post-cover" src={resolveMediaUrl(cover)} alt="封面预览" />
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Markdown 内容"
            rows={20}
          />
          <button type="submit">{isEditMode ? '保存修改' : '发布文章'}</button>
          {error && <p className="error">{error}</p>}
        </div>
        <article className="markdown">
          <ReactMarkdown>{preview}</ReactMarkdown>
        </article>
      </form>
    </section>
  )
}

export default WritePage
