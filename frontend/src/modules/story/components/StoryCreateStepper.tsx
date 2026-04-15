import { useState } from 'react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'

const ICP_TAG_OPTIONS = [
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'burnout', label: 'Burnout' },
  { value: 'career_change', label: 'Chuyển ngành' },
  { value: 'salary_raise', label: 'Tăng lương' },
  { value: 'job_seeker', label: 'Tìm việc' },
  { value: 'student', label: 'Sinh viên' },
  { value: 'manager', label: 'Quản lý' },
  { value: 'entrepreneur', label: 'Khởi nghiệp' },
]

interface StoryFormData {
  student_name: string
  course_name: string
  student_avatar_url: string
  ops_student_ref: string
  pain_point: string
  transformation: string
  icp_tags: string[]
}

interface StoryCreateStepperProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: StoryFormData) => Promise<void>
}

const INITIAL_DATA: StoryFormData = {
  student_name: '',
  course_name: '',
  student_avatar_url: '',
  ops_student_ref: '',
  pain_point: '',
  transformation: '',
  icp_tags: [],
}

const STEP_TITLES = [
  'Thông tin học viên',
  'Câu chuyện',
  'Tags & Xác nhận',
]

function StepDots({ currentStep, total }: { currentStep: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i === currentStep
              ? 'w-6 bg-nedu-primary'
              : i < currentStep
              ? 'w-2 bg-nedu-primary opacity-50'
              : 'w-2 bg-gray-300'
          }`}
        />
      ))}
    </div>
  )
}

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700 font-body">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nedu-primary focus:border-transparent font-body placeholder:text-gray-400'

export function StoryCreateStepper({ isOpen, onClose, onSubmit }: StoryCreateStepperProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<StoryFormData>(INITIAL_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof StoryFormData, string>>>({})

  const update = (field: keyof StoryFormData, value: string | string[]) => {
    setData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const toggleTag = (tag: string) => {
    setData((prev) => ({
      ...prev,
      icp_tags: prev.icp_tags.includes(tag)
        ? prev.icp_tags.filter((t) => t !== tag)
        : [...prev.icp_tags, tag],
    }))
  }

  const validateStep = (): boolean => {
    const newErrors: Partial<Record<keyof StoryFormData, string>> = {}
    if (step === 0) {
      if (!data.student_name.trim()) newErrors.student_name = 'Tên học viên là bắt buộc'
      if (!data.course_name.trim()) newErrors.course_name = 'Tên khoá học là bắt buộc'
    }
    if (step === 1) {
      if (!data.pain_point.trim()) newErrors.pain_point = 'Vui lòng mô tả khó khăn'
      if (!data.transformation.trim()) newErrors.transformation = 'Vui lòng mô tả kết quả'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep()) return
    setStep((s) => s + 1)
  }

  const handleBack = () => setStep((s) => s - 1)

  const handleClose = () => {
    setStep(0)
    setData(INITIAL_DATA)
    setErrors({})
    onClose()
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      handleClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const initials = data.student_name
    ? data.student_name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Thu thập story — ${STEP_TITLES[step]}`}
      size="lg"
    >
      <StepDots currentStep={step} total={3} />

      {/* Step 1: Student info */}
      {step === 0 && (
        <div className="space-y-4">
          <FieldRow label="Tên học viên" required>
            <input
              type="text"
              className={inputClass}
              placeholder="Nguyễn Văn A"
              value={data.student_name}
              onChange={(e) => update('student_name', e.target.value)}
            />
            {errors.student_name && (
              <p className="text-xs text-red-500 font-body">{errors.student_name}</p>
            )}
          </FieldRow>

          <FieldRow label="Tên khoá học" required>
            <input
              type="text"
              className={inputClass}
              placeholder="SQL for Data Analysis"
              value={data.course_name}
              onChange={(e) => update('course_name', e.target.value)}
            />
            {errors.course_name && (
              <p className="text-xs text-red-500 font-body">{errors.course_name}</p>
            )}
          </FieldRow>

          <FieldRow label="Avatar URL (tuỳ chọn)">
            <input
              type="url"
              className={inputClass}
              placeholder="https://example.com/avatar.jpg"
              value={data.student_avatar_url}
              onChange={(e) => update('student_avatar_url', e.target.value)}
            />
          </FieldRow>

          <FieldRow label="Mã học viên OPS (tuỳ chọn)">
            <input
              type="text"
              className={inputClass}
              placeholder="HV-2026-0001"
              value={data.ops_student_ref}
              onChange={(e) => update('ops_student_ref', e.target.value)}
            />
          </FieldRow>
        </div>
      )}

      {/* Step 2: Story */}
      {step === 1 && (
        <div className="space-y-4">
          <FieldRow label="Khó khăn / vấn đề trước khi học" required>
            <textarea
              rows={4}
              className={inputClass}
              placeholder="Học viên gặp khó khăn gì? Vì sao họ tìm đến khoá học?"
              value={data.pain_point}
              onChange={(e) => update('pain_point', e.target.value)}
            />
            {errors.pain_point && (
              <p className="text-xs text-red-500 font-body">{errors.pain_point}</p>
            )}
          </FieldRow>

          <FieldRow label="Kết quả / thay đổi sau khi học" required>
            <textarea
              rows={4}
              className={inputClass}
              placeholder="Sau khoá học, học viên đạt được điều gì? Cuộc sống/công việc thay đổi thế nào?"
              value={data.transformation}
              onChange={(e) => update('transformation', e.target.value)}
            />
            {errors.transformation && (
              <p className="text-xs text-red-500 font-body">{errors.transformation}</p>
            )}
          </FieldRow>
        </div>
      )}

      {/* Step 3: Tags + preview */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 font-body mb-2">ICP Tags</p>
            <div className="flex flex-wrap gap-2">
              {ICP_TAG_OPTIONS.map((tag) => {
                const isSelected = data.icp_tags.includes(tag.value)
                return (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => toggleTag(tag.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all font-body ${
                      isSelected
                        ? 'bg-nedu-primary text-white border-nedu-primary'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-nedu-primary hover:text-nedu-primary'
                    }`}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview card */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-body">Xem trước</p>

            <div className="flex items-center gap-3">
              {data.student_avatar_url ? (
                <img
                  src={data.student_avatar_url}
                  alt={data.student_name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-nedu-primary flex items-center justify-center text-white text-sm font-bold font-headline">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900 font-body">
                  {data.student_name || '—'}
                </p>
                <Badge variant="blue" className="mt-0.5">
                  {data.course_name || '—'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-500 font-body mb-0.5">Khó khăn</p>
                <p className="text-sm text-gray-700 font-body leading-relaxed">
                  {data.pain_point || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 font-body mb-0.5">Kết quả</p>
                <p className="text-sm text-gray-700 font-body leading-relaxed">
                  {data.transformation || '—'}
                </p>
              </div>
            </div>

            {data.icp_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.icp_tags.map((tag) => (
                  <Badge key={tag} variant="gray">
                    {ICP_TAG_OPTIONS.find((o) => o.value === tag)?.label ?? tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <div>
          {step > 0 && (
            <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
              ← Quay lại
            </Button>
          )}
        </div>
        <div>
          {step < 2 ? (
            <Button variant="primary" onClick={handleNext}>
              Tiếp theo →
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Lưu story
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
