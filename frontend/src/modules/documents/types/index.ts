// src/modules/documents/types/index.ts
export type DocType = 'sop' | 'jd' | 'tracker' | 'playbook' | 'template' | 'guideline' | 'report' | 'brief'
export type DocumentStatus = 'done' | 'in_progress' | 'not_started'

export interface Document {
  id: string
  title: string
  doc_type: DocType
  status: DocumentStatus
  file_url?: string
  version?: string
  updated_at: string
  created_at: string
}
