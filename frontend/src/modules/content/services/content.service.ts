import { apiClient } from '@/shared/config/api-client'
import { supabase } from '@/shared/config/supabase'
import type {
  Post,
  PostsResponse,
  Channel,
  CreatePostBody,
  UpdatePostBody,
  PostActionBody,
  PostFilters,
} from '../content.types'

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

function buildQuery(filters?: PostFilters): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.channel_code) params.set('channel_code', filters.channel_code)
  if (filters.campaign_id) params.set('campaign_id', filters.campaign_id)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.per_page) params.set('per_page', String(filters.per_page))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const contentService = {
  getPosts: (filters?: PostFilters): Promise<PostsResponse> =>
    apiClient.get<PostsResponse>(`/api/v1/marketing/posts${buildQuery(filters)}`),

  getPostById: (id: string): Promise<Post> =>
    apiClient.get<Post>(`/api/v1/marketing/posts/${id}`),

  createPost: (data: CreatePostBody): Promise<Post> =>
    apiClient.post<Post>('/api/v1/marketing/posts', data),

  updatePost: (id: string, data: UpdatePostBody): Promise<Post> =>
    apiClient.patch<Post>(`/api/v1/marketing/posts/${id}`, data),

  performAction: (id: string, body: PostActionBody): Promise<Post> =>
    apiClient.post<Post>(`/api/v1/marketing/posts/${id}/actions`, body),

  uploadMedia: async (id: string, file: File): Promise<Response> => {
    const token = await getToken()
    const form = new FormData()
    form.append('file', file)
    return fetch(`/api/v1/marketing/posts/${id}/media`, {
      method: 'POST',
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  },

  getChannels: (): Promise<{ data: Channel[] }> =>
    apiClient.get<{ data: Channel[] }>('/api/v1/marketing/channels'),
}
