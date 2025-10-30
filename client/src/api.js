export async function api(path, init = {}) {
  const opts = {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  };
  const res = await fetch(`/api${path}`, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const apiForm = async (url, formData, method = 'POST') => {
  const res = await fetch(`${API_URL}${url}`, {
    method,
    credentials: 'include',
    body: formData
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text);
    err.status = res.status;
    throw err;
  }
  return res.json();
};