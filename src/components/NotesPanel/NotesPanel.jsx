'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  MONTH_NAMES,
  formatDateRange,
  dateToKey,
  monthYearKey,
  isSameDay,
} from '@/utils/calendarUtils';
import { getNote, setNote, getNotesForMonth } from '@/utils/storage';
import './NotesPanel.css';

export default function NotesPanel({
  year,
  month,
  rangeStart,
  rangeEnd,
  onNotesChange,
}) {
  const [activeTab, setActiveTab] = useState('month');
  const [monthNote, setMonthNote] = useState('');
  const [dateNote, setDateNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [notesRevision, setNotesRevision] = useState(0);
  const textareaRef = useRef(null);
  const saveTimerRef = useRef(null);

  const mKey = monthYearKey(year, month);
  const hasDateSelection = !!rangeStart;
  const dateKey = rangeStart ? dateToKey(rangeStart) : null;
  const rangeDateKey = rangeStart && rangeEnd && !isSameDay(rangeStart, rangeEnd)
    ? `${dateToKey(rangeStart)}_to_${dateToKey(rangeEnd)}`
    : dateKey;

  const monthDateNotes = useMemo(() => {
    const notes = getNotesForMonth(year, month);
    return Object.entries(notes)
      .filter(([key]) => key.startsWith('date-'))
      .map(([key, value]) => {
        const raw = key.replace('date-', '');
        if (raw.includes('_to_')) {
          const [start, end] = raw.split('_to_');
          return {
            key,
            label: `${start.slice(-2)} to ${end.slice(-2)}`,
            preview: value,
          };
        }
        return {
          key,
          label: raw.slice(-2),
          preview: value,
        };
      });
  }, [year, month, notesRevision]);

  useEffect(() => {
    setMonthNote(getNote(`month-${mKey}`) || '');
  }, [mKey]);

  useEffect(() => {
    if (rangeDateKey) {
      setDateNote(getNote(`date-${rangeDateKey}`) || '');
      setActiveTab('date');
    } else {
      setDateNote('');
      setActiveTab('month');
    }
  }, [rangeDateKey]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const markSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSave = (key, value) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setNote(key, value);
      setNotesRevision((v) => v + 1);
      markSaved();
      onNotesChange?.();
    }, 400);
  };

  const handleDeleteNote = (key, resetUi) => {
    if (!key) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setNote(key, '');
    if (typeof resetUi === 'function') {
      resetUi();
    }
    setNotesRevision((v) => v + 1);
    markSaved();
    onNotesChange?.();
  };

  const handleMonthNoteChange = (e) => {
    const val = e.target.value;
    setMonthNote(val);
    handleSave(`month-${mKey}`, val);
  };

  const handleDateNoteChange = (e) => {
    const val = e.target.value;
    setDateNote(val);
    if (rangeDateKey) {
      handleSave(`date-${rangeDateKey}`, val);
    }
  };

  const handleDeleteMonthNote = () => {
    handleDeleteNote(`month-${mKey}`, () => setMonthNote(''));
  };

  const handleDeleteDateNote = () => {
    if (!rangeDateKey) return;
    handleDeleteNote(`date-${rangeDateKey}`, () => setDateNote(''));
  };

  const handleDeleteListedDateNote = (noteKey) => {
    handleDeleteNote(noteKey, () => {
      if (`date-${rangeDateKey}` === noteKey) {
        setDateNote('');
      }
    });
  };

  const selectionLabel = hasDateSelection
    ? formatDateRange(rangeStart, rangeEnd)
    : 'No date selected';

  return (
    <div className="notes-panel" id="notes-panel">
      <div className="notes-header">
        <div className="notes-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h3 className="notes-title">Notes</h3>
        {saved && (
          <span className="save-indicator" id="save-indicator">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Saved
          </span>
        )}
      </div>

      
      <div className="notes-tabs">
        <button
          className={`notes-tab ${activeTab === 'month' ? 'active' : ''}`}
          onClick={() => setActiveTab('month')}
          id="tab-month-notes"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {MONTH_NAMES[month]}
        </button>
        <button
          className={`notes-tab ${activeTab === 'date' ? 'active' : ''} ${!hasDateSelection ? 'disabled' : ''}`}
          onClick={() => hasDateSelection && setActiveTab('date')}
          disabled={!hasDateSelection}
          id="tab-date-notes"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {hasDateSelection ? selectionLabel : 'Select dates'}
        </button>
      </div>

      
      <div className="notes-content">
        {activeTab === 'month' ? (
          <div className="note-area" key={`month-${mKey}`}>
            <label className="note-label" htmlFor="month-note-textarea">
              Monthly memo for {MONTH_NAMES[month]} {year}
            </label>
            <textarea
              ref={textareaRef}
              id="month-note-textarea"
              className="note-textarea"
              placeholder={`Write your notes for ${MONTH_NAMES[month]}...`}
              value={monthNote}
              onChange={handleMonthNoteChange}
              rows={5}
            />
            <div className="note-actions">
              <button
                type="button"
                className="note-delete-btn"
                onClick={handleDeleteMonthNote}
                disabled={!monthNote.trim()}
                id="btn-delete-month-note"
              >
                Clear note
              </button>
            </div>
            {monthDateNotes.length > 0 && (
              <div className="month-date-notes-summary" id="month-date-notes-summary">
                <p className="month-date-notes-title">Saved date notes this month</p>
                <div className="month-date-notes-list">
                  {monthDateNotes.map((note) => (
                    <div key={note.key} className="month-date-note-item" title={note.preview}>
                      <span className="month-date-note-day">{note.label}</span>
                      <span className="month-date-note-preview">{note.preview}</span>
                      <button
                        type="button"
                        className="month-date-note-delete"
                        onClick={() => handleDeleteListedDateNote(note.key)}
                        aria-label={`Delete note for ${note.label}`}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="note-area" key={`date-${rangeDateKey}`}>
            <label className="note-label" htmlFor="date-note-textarea">
              Notes for {selectionLabel}
            </label>
            <textarea
              id="date-note-textarea"
              className="note-textarea"
              placeholder={`Add notes for ${selectionLabel}...`}
              value={dateNote}
              onChange={handleDateNoteChange}
              rows={5}
            />
            <div className="note-actions">
              <button
                type="button"
                className="note-delete-btn"
                onClick={handleDeleteDateNote}
                disabled={!dateNote.trim()}
                id="btn-delete-date-note"
              >
                Clear note
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
