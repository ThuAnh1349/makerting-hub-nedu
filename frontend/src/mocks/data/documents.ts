// src/mocks/data/documents.ts
// v1.2: doc_type dùng DocType union — không dùng string thô
import type { Document, DocType } from '@modules/documents/types'

export const MOCK_DOCUMENTS: Document[] = [
  { id: 'doc-0001-aaaa-bbbb-cccc-dddddddddddd', title: 'SOP Xử lý Lead từ Facebook',      doc_type: 'sop' as DocType,       status: 'done',        file_url: 'https://drive.google.com/file/d/sop-001',          version: 'v2.1',  updated_at: '2026-04-01T00:00:00.000Z', created_at: '2026-02-01T00:00:00.000Z' },
  { id: 'doc-0002-aaaa-bbbb-cccc-dddddddddddd', title: 'JD Marketing Staff',               doc_type: 'jd' as DocType,        status: 'done',        file_url: 'https://drive.google.com/file/d/jd-001',           version: 'v1.0',  updated_at: '2026-03-15T00:00:00.000Z', created_at: '2026-03-01T00:00:00.000Z' },
  { id: 'doc-0003-aaaa-bbbb-cccc-dddddddddddd', title: 'Content Calendar Template Q2',     doc_type: 'template' as DocType,  status: 'in_progress',                                                                        updated_at: '2026-04-06T00:00:00.000Z', created_at: '2026-04-01T00:00:00.000Z' },
  { id: 'doc-0004-aaaa-bbbb-cccc-dddddddddddd', title: 'Lead Scoring Tracker',             doc_type: 'tracker' as DocType,   status: 'in_progress', file_url: 'https://docs.google.com/spreadsheets/d/tracker-001', version: 'v0.5',  updated_at: '2026-04-05T00:00:00.000Z', created_at: '2026-03-20T00:00:00.000Z' },
  { id: 'doc-0005-aaaa-bbbb-cccc-dddddddddddd', title: 'Brand Voice Guideline',            doc_type: 'guideline' as DocType, status: 'not_started',                                                                        updated_at: '2026-04-01T00:00:00.000Z', created_at: '2026-04-01T00:00:00.000Z' },
  { id: 'doc-0006-aaaa-bbbb-cccc-dddddddddddd', title: 'Ad Creative Playbook',             doc_type: 'playbook' as DocType,  status: 'not_started',                                                                        updated_at: '2026-04-01T00:00:00.000Z', created_at: '2026-04-01T00:00:00.000Z' },
  { id: 'doc-0007-aaaa-bbbb-cccc-dddddddddddd', title: 'Q1 Marketing Report',              doc_type: 'report' as DocType,    status: 'done',        file_url: 'https://drive.google.com/file/d/report-q1',        version: 'v1.0',  updated_at: '2026-04-02T00:00:00.000Z', created_at: '2026-03-25T00:00:00.000Z' },
  { id: 'doc-0008-aaaa-bbbb-cccc-dddddddddddd', title: 'Referral Program Brief',           doc_type: 'brief' as DocType,     status: 'not_started',                                                                        updated_at: '2026-04-01T00:00:00.000Z', created_at: '2026-04-01T00:00:00.000Z' },
]
