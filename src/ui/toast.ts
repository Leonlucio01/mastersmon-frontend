export function showToast(title: string, message: string): void {
  const root = document.getElementById('toast-root');
  if (!root) return;

  const node = document.createElement('div');
  node.className = 'toast';
  node.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;
  root.appendChild(node);

  window.setTimeout(() => {
    node.remove();
  }, 4200);
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
