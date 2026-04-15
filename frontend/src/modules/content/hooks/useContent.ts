import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { contentService } from '../services/content.service'
import type {
  PostFilters,
  CreatePostBody,
  UpdatePostBody,
  PostActionBody,
} from '../content.types'

export function usePosts(filters?: PostFilters) {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: () => contentService.getPosts(filters),
    refetchInterval: 30_000,
  })
}

export function usePostDetail(postId: string | null) {
  return useQuery({
    queryKey: ['posts', postId],
    queryFn: () => contentService.getPostById(postId!),
    enabled: !!postId,
  })
}

export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: () => contentService.getChannels(),
    staleTime: 3_600_000,
    select: (res) => res.data,
  })
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePostBody) => contentService.createPost(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useUpdatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostBody }) =>
      contentService.updatePost(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['posts', variables.id] })
    },
  })
}

export function usePostAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PostActionBody }) =>
      contentService.performAction(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['posts', variables.id] })
      qc.invalidateQueries({ queryKey: ['today', 'summary'] })
    },
  })
}
