import { useRef, useState, useCallback } from 'react'
import type { PostMedia } from '../content.types'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500 MB
const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
]

interface MediaUploaderProps {
  onFilesSelected: (files: File[]) => void
  existingMedia: PostMedia[]
  isUploading: boolean
  onDeleteMedia?: (mediaId: string) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `"${file.name}" không đúng định dạng. Chỉ chấp nhận JPG, PNG, WebP, MP4, MOV.`
  }
  const isVideo = file.type.startsWith('video/')
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return `"${file.name}" vượt giới hạn 500MB (hiện tại: ${formatFileSize(file.size)}).`
  }
  if (!isVideo && file.size > MAX_IMAGE_SIZE) {
    return `"${file.name}" vượt giới hạn 10MB (hiện tại: ${formatFileSize(file.size)}).`
  }
  return null
}

export function MediaUploader({
  onFilesSelected,
  existingMedia,
  isUploading,
  onDeleteMedia,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleFiles = useCallback(
    (files: File[]) => {
      const errs: string[] = []
      const valid: File[] = []
      for (const file of files) {
        const err = validateFile(file)
        if (err) {
          errs.push(err)
        } else {
          valid.push(file)
        }
      }
      setErrors(errs)
      if (valid.length > 0) {
        onFilesSelected(valid)
      }
    },
    [onFilesSelected],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      handleFiles(files)
    },
    [handleFiles],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    handleFiles(files)
    // Reset so same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-colors duration-150
          ${isDragging
            ? 'border-nedu-primary bg-nedu-primary/5'
            : 'border-gray-300 hover:border-nedu-primary hover:bg-gray-50'
          }
        `}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        aria-label="Tải lên ảnh hoặc video"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleInputChange}
          className="sr-only"
          aria-hidden="true"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <svg
              className="animate-spin w-8 h-8 text-nedu-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
              />
            </svg>
            <p className="text-sm text-gray-500 font-body">Đang tải lên...</p>
          </div>
        ) : (
          <>
            <svg
              className="w-10 h-10 mx-auto text-gray-400 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700 font-body">
              Kéo thả ảnh/video vào đây hoặc nhấn để chọn
            </p>
            <p className="text-xs text-gray-400 font-body mt-1">
              Ảnh tối đa 10MB · Video tối đa 500MB
            </p>
            <p className="text-xs text-gray-400 font-body">
              JPG, PNG, WebP, MP4, MOV
            </p>
          </>
        )}
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-red-600 font-body flex items-start gap-1">
              <svg
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Existing media grid */}
      {existingMedia.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {existingMedia.map((media) => (
            <div key={media.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
              {media.media_type === 'image' ? (
                <img
                  src={media.thumbnail_url ?? media.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {media.duration_seconds !== null && (
                    <span className="absolute bottom-1 right-1 text-white text-xs bg-black/60 px-1 rounded font-body">
                      {Math.floor(media.duration_seconds / 60)}:
                      {String(Math.floor(media.duration_seconds % 60)).padStart(2, '0')}
                    </span>
                  )}
                </div>
              )}

              {/* Delete overlay */}
              {onDeleteMedia && (
                <button
                  type="button"
                  onClick={() => onDeleteMedia(media.id)}
                  className="
                    absolute inset-0 flex items-center justify-center
                    bg-black/50 opacity-0 group-hover:opacity-100
                    transition-opacity duration-150
                  "
                  aria-label="Xóa ảnh/video này"
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
