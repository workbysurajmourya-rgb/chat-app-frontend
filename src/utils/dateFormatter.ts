export function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
