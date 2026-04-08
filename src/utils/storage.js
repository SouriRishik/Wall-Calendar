

const STORAGE_KEY = 'wall-calendar-notes';

export function loadNotes() {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveNotes(notes) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.warn('Failed to save notes:', e);
  }
}

export function getNote(key) {
  const notes = loadNotes();
  return notes[key] || '';
}

export function setNote(key, value) {
  const notes = loadNotes();
  if (value.trim() === '') {
    delete notes[key];
  } else {
    notes[key] = value;
  }
  saveNotes(notes);
  return notes;
}

export function hasNote(key) {
  const notes = loadNotes();
  return !!notes[key] && notes[key].trim() !== '';
}

export function getNotesForMonth(year, month) {
  const notes = loadNotes();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const result = {};

  for (const [key, value] of Object.entries(notes)) {
    if (!value || value.trim() === '') continue;

    if (key.startsWith('month-')) {
      const monthKey = key.replace('month-', '');
      if (monthKey === prefix) {
        result[key] = value;
      }
      continue;
    }

    if (key.startsWith('date-')) {
      const datePart = key.replace('date-', '');
      if (datePart.includes('_to_')) {
        const [start, end] = datePart.split('_to_');
        if (start.startsWith(prefix) || end.startsWith(prefix)) {
          result[key] = value;
        }
      } else if (datePart.startsWith(prefix)) {
        result[key] = value;
      }
    }
  }

  return result;
}

const THEME_KEY = 'wall-calendar-theme';

export function loadTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    return localStorage.getItem(THEME_KEY) || 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.warn('Failed to save theme:', e);
  }
}
