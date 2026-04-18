// src/mocks/init.ts
export async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKING !== 'true') return
  const { worker } = await import('./browser')
  return worker.start({ onUnhandledRequest: 'bypass' })  // bypass bắt buộc — Supabase auth + assets không đi qua mock
}
