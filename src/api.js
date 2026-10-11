export async function api(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch('/api' + path, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  } catch { throw new Error('Cannot reach the server. Check your connection and try again.') }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong'), { status: res.status, fields: data.fields })
  return data
}
export const t12 = (t) => { const [h, m] = t.split(':'); return `${+h % 12 || 12}:${m} ${+h < 12 ? 'AM' : 'PM'}` }
