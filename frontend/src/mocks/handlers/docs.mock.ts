import { http, HttpResponse } from 'msw'

export const docsHandlers = [
  http.get('/api/v1/marketing/docs', () => {
    return HttpResponse.json({
      data: [
        { id: 'd1', doc_key: 'sop_lead', title: 'SOP Phân loại Lead', status: 'completed', file_url: 'https://drive.google.com/file/sop_lead', file_version: 'v1.2', last_updated: '2026-04-01' },
        { id: 'd2', doc_key: 'sop_content', title: 'SOP Quy trình tạo nội dung', status: 'completed', file_url: 'https://drive.google.com/file/sop_content', file_version: 'v1.0', last_updated: '2026-03-28' },
        { id: 'd3', doc_key: 'sop_approval', title: 'SOP Duyệt bài', status: 'in_progress', file_url: null, file_version: null, last_updated: null },
        { id: 'd4', doc_key: 'jd_staff', title: 'JD Marketing Staff', status: 'completed', file_url: 'https://drive.google.com/file/jd_staff', file_version: 'v2.0', last_updated: '2026-04-05' },
        { id: 'd5', doc_key: 'jd_co_leader', title: 'JD Co-Leader', status: 'in_progress', file_url: null, file_version: null, last_updated: null },
        { id: 'd6', doc_key: 'tracker_lead', title: 'Lead Tracker Template', status: 'not_started', file_url: null, file_version: null, last_updated: null },
        { id: 'd7', doc_key: 'tracker_content', title: 'Content Tracker Template', status: 'not_started', file_url: null, file_version: null, last_updated: null },
        { id: 'd8', doc_key: 'brand_guideline', title: 'Brand Guideline Nedu', status: 'not_started', file_url: null, file_version: null, last_updated: null },
      ],
      meta: { total_count: 8, completed_count: 3, completion_pct: 37.5 },
    })
  }),
]
