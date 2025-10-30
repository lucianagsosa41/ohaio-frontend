// src/api.js
const BASE = '/api';

async function http(method, path, body) {
  const url = `${BASE}${path}`;
  console.log(`[API] ${method} ${url}`, body || '');
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const ct = res.headers.get('content-type') || '';
    const text = await res.text().catch(() => '');
    const maybeJson = ct.includes('application/json');
    if (!res.ok) {
      console.error(`[API] ERROR ${res.status} ${res.statusText} @ ${url}`, text);
      throw new Error(`${res.status} ${res.statusText} @ ${url} -> ${text}`);
    }
    return maybeJson ? JSON.parse(text) : null;
  } catch (err) {
    console.error('[API] FETCH FAILED:', err);
    throw err;
  }
}

export const apiGet  = (p)    => http('GET',    p);
export const apiPost = (p,b)  => http('POST',   p, b);
export const apiPut  = (p,b)  => http('PUT',    p, b);
export const apiDel  = (p)    => http('DELETE', p);
export async function apiPatch(p,b){
  const r = await fetch(`${BASE}${p}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: b ? JSON.stringify(b) : undefined });
  if(!r.ok) throw r; return r.json();
}
