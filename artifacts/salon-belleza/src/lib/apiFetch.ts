function getToken(): string | null {
  try {
    const raw = localStorage.getItem("salon_user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.id ? `token-${u.id}` : null;
  } catch { return null; }
}

export async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as any),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const base = import.meta.env.VITE_API_URL ?? "";
  const url = `${base}${path.startsWith("/api") ? path : `/api${path}`}`;  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let err: any = { error: res.statusText };
    try { err = await res.json(); } catch {}
    throw new Error(err.error || `Error ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

export function downloadCsv(path: string, filename: string) {
  const token = getToken();
  fetch(path.startsWith("/api") ? path : `/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then(async r => {
    if (!r.ok) throw new Error("Error al descargar");
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });
}
