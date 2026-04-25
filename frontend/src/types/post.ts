export type CategoryInfo = {
  id: number
  name: string
}

export type AuthorInfo = {
  id: number
  username: string
}

export type Post = {
  id: number
  title: string
  content: string
  cover: string | null
  category: CategoryInfo | null
  tags: string[]
  author: AuthorInfo
  views: number
  status: 'draft' | 'published'
  like_count: number
  favorite_count: number
  liked: boolean
  favorited: boolean
  created_at: string
  updated_at: string
}
