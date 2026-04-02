/**
 * chatUtils.js — Formatting helpers for chat UI
 */

/**
 * Returns a short time string for message bubbles: "14:30"
 */
export function formatChatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Returns a relative label for conversation list last message.
 * Today → "14:30", Yesterday → "ayer", older → "12/03"
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);

  if (diffDays === 0) return formatChatTime(d);
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) {
    return d.toLocaleDateString('es-AR', { weekday: 'short' });
  }
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

/**
 * Returns "Última vez hace X min" / "En línea" for header subtitle.
 */
export function formatLastSeen(date, isOnline) {
  if (isOnline) return 'En línea';
  if (!date) return '';
  const now = Date.now();
  const diff = Math.floor((now - new Date(date).getTime()) / 60000);
  if (diff < 1) return 'Visto recién';
  if (diff < 60) return `Visto hace ${diff} min`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `Visto hace ${hours}h`;
  return 'Visto hace un tiempo';
}

/**
 * Returns a section date label — "Hoy", "Ayer", "12 de marzo"
 */
export function formatSectionDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

/**
 * Groups messages by date into sections.
 * Returns [{ date, label, data: Message[] }, ...]
 */
export function groupMessagesByDate(messages) {
  const sections = [];
  let currentDateStr = null;

  for (const msg of messages) {
    const d = msg.fechaEnvio ? new Date(msg.fechaEnvio) : null;
    const dateStr = d ? d.toDateString() : 'unknown';

    if (dateStr !== currentDateStr) {
      currentDateStr = dateStr;
      sections.push({ date: d, label: formatSectionDate(d), data: [msg] });
    } else {
      sections[sections.length - 1].data.push(msg);
    }
  }

  return sections;
}
