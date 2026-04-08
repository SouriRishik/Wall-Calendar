'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import CalendarHeader from '@/components/CalendarHeader/CalendarHeader';
import CalendarGrid from '@/components/CalendarGrid/CalendarGrid';
import NotesPanel from '@/components/NotesPanel/NotesPanel';
import YearOverview from '@/components/YearOverview/YearOverview';
import { isSameDay, generateCalendarDays, MONTH_NAMES, MONTH_IMAGES, DAY_NAMES } from '@/utils/calendarUtils';
import { getNotesForMonth, loadTheme, saveTheme } from '@/utils/storage';
import './CalendarApp.css';

const FLIP_OUT_MS = 280;
const FLIP_IN_MS = 240;
const MAX_MANUAL_ROTATION_DEG = 68;
const MANUAL_DRAG_DISTANCE_PX = 190;
const MANUAL_COMMIT_THRESHOLD = 0.36;

function getShiftedMonthYear(year, month, motion) {
  if (motion === 'prev') {
    if (month === 0) {
      return { year: year - 1, month: 11 };
    }
    return { year, month: month - 1 };
  }
  if (month === 11) {
    return { year: year + 1, month: 0 };
  }
  return { year, month: month + 1 };
}

export default function CalendarApp() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const currentMonthRef = useRef(today.getMonth());
  const currentYearRef = useRef(today.getFullYear());
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [direction, setDirection] = useState(null);
  const [noteDates, setNoteDates] = useState({});
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);
  const [showYearView, setShowYearView] = useState(false);
  const [flipPhase, setFlipPhase] = useState('');
  const [flipDirection, setFlipDirection] = useState('next');
  const flipTimersRef = useRef([]);
  const isFlippingRef = useRef(false);
  const queuedFlipRef = useRef(null);
  const dragRef = useRef({
    active: false,
    pointerId: null,
    startY: 0,
    direction: 'next',
    progress: 0,
  });
  const [manualFlip, setManualFlip] = useState({ active: false, direction: 'next', progress: 0 });
  const [manualRelease, setManualRelease] = useState(null);
  const [manualAnimMs, setManualAnimMs] = useState(0);
  useEffect(() => {
    const savedTheme = loadTheme();
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    setMounted(true);
  }, []);
  const refreshNoteDates = useCallback(() => {
    const notes = getNotesForMonth(currentYear, currentMonth);
    const dateMap = {};
    for (const key of Object.keys(notes)) {
      if (key.startsWith('date-')) {
        const dateStr = key.replace('date-', '');
        if (dateStr.includes('_to_')) {
          const [startStr, endStr] = dateStr.split('_to_');
          dateMap[startStr] = true;
          dateMap[endStr] = true;
        } else {
          dateMap[dateStr] = true;
        }
      }
    }
    setNoteDates(dateMap);
  }, [currentYear, currentMonth]);

  useEffect(() => {
    refreshNoteDates();
  }, [refreshNoteDates]);

  useEffect(() => {
    currentMonthRef.current = currentMonth;
    currentYearRef.current = currentYear;
  }, [currentMonth, currentYear]);

  const clearFlipTimers = useCallback(() => {
    for (const timer of flipTimersRef.current) {
      clearTimeout(timer);
    }
    flipTimersRef.current = [];
    isFlippingRef.current = false;
  }, []);

  useEffect(() => {
    return () => clearFlipTimers();
  }, [clearFlipTimers]);

  const runWithFlip = useCallback(
    (updateFn, motion = 'next') => {
      if (isFlippingRef.current) {
        queuedFlipRef.current = { updateFn, motion };
        return;
      }
      clearFlipTimers();
      isFlippingRef.current = true;
      setFlipDirection(motion);
      setFlipPhase('flip-out');
      const outTimer = setTimeout(() => {
        updateFn();
        setFlipPhase('flip-in');
        const inTimer = setTimeout(() => {
          setFlipPhase('');
          isFlippingRef.current = false;
        }, FLIP_IN_MS);
        flipTimersRef.current.push(inTimer);
      }, FLIP_OUT_MS);
      flipTimersRef.current.push(outTimer);
    },
    [clearFlipTimers]
  );

  useEffect(() => {
    if (!flipPhase && queuedFlipRef.current && !isFlippingRef.current) {
      const nextFlip = queuedFlipRef.current;
      queuedFlipRef.current = null;
      runWithFlip(nextFlip.updateFn, nextFlip.motion);
    }
  }, [flipPhase, runWithFlip]);

  const applyMonthShift = useCallback((motion, selectedDate = null) => {
    setDirection(null);
    if (selectedDate) {
      setRangeStart(new Date(selectedDate));
      setRangeEnd(null);
    } else {
      setRangeStart(null);
      setRangeEnd(null);
    }
    const next = getShiftedMonthYear(currentYearRef.current, currentMonthRef.current, motion);
    setCurrentYear(next.year);
    setCurrentMonth(next.month);
  }, []);

  const goToPrevMonth = useCallback(() => {
    runWithFlip(() => applyMonthShift('prev'), 'prev');
  }, [applyMonthShift, runWithFlip]);

  const goToNextMonth = useCallback(() => {
    runWithFlip(() => applyMonthShift('next'), 'next');
  }, [applyMonthShift, runWithFlip]);

  const handleOverflowDateClick = useCallback(
    (dayObj) => {
      if (dayObj.isPrevMonth) {
        runWithFlip(() => applyMonthShift('prev', dayObj.date), 'prev');
      } else if (dayObj.isNextMonth) {
        runWithFlip(() => applyMonthShift('next', dayObj.date), 'next');
      }
    },
    [applyMonthShift, runWithFlip]
  );

  const goToToday = useCallback(() => {
    const now = new Date();
    const isAlreadyCurrentMonth =
      currentYear === now.getFullYear() && currentMonth === now.getMonth();

    if (isAlreadyCurrentMonth) {
      setDirection(null);
      setRangeStart(null);
      setRangeEnd(null);
      return;
    }

    const targetIndex = now.getFullYear() * 12 + now.getMonth();
    const currentIndex = currentYear * 12 + currentMonth;
    const motion = targetIndex >= currentIndex ? 'next' : 'prev';
    runWithFlip(() => {
      setDirection(null);
      setRangeStart(null);
      setRangeEnd(null);
      setCurrentMonth(now.getMonth());
      setCurrentYear(now.getFullYear());
    }, motion);
  }, [currentMonth, currentYear, runWithFlip]);

  const goToMonth = useCallback(
    (month) => {
      if (month === currentMonth) {
        setShowYearView(false);
        return;
      }
      setShowYearView(false);
      const motion = month > currentMonth ? 'next' : 'prev';
      runWithFlip(() => {
        setCurrentMonth(month);
        setDirection(null);
      }, motion);
    },
    [currentMonth, runWithFlip]
  );

  const startManualCornerFlip = useCallback(
    (motion, e) => {
      if (showYearView || isFlippingRef.current) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      clearFlipTimers();
      queuedFlipRef.current = null;
      isFlippingRef.current = true;
      dragRef.current = {
        active: true,
        pointerId: e.pointerId,
        startY: e.clientY,
        direction: motion,
        progress: 0,
      };
      setFlipDirection(motion);
      setFlipPhase('');
      setManualRelease(null);
      setManualAnimMs(0);
      setManualFlip({ active: true, direction: motion, progress: 0 });
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [showYearView, clearFlipTimers]
  );

  const handleManualCornerMove = useCallback((e) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== e.pointerId) return;
    const deltaY = Math.max(0, drag.startY - e.clientY);
    const progress = Math.min(1, deltaY / MANUAL_DRAG_DISTANCE_PX);
    if (Math.abs(progress - drag.progress) < 0.005) return;
    drag.progress = progress;
    setManualFlip((prev) => ({ ...prev, progress }));
  }, []);

  const endManualCornerFlip = useCallback(
    (e, forceCancel = false) => {
      const drag = dragRef.current;
      if (!drag.active || drag.pointerId !== e.pointerId) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      drag.active = false;
      const progress = drag.progress;
      const motion = drag.direction;
      drag.pointerId = null;
      drag.progress = 0;

      setManualFlip({ active: false, direction: motion, progress: 0 });
      setManualRelease({ direction: motion, progress });
      setFlipDirection(motion);

      const shouldCommit = !forceCancel && progress >= MANUAL_COMMIT_THRESHOLD;
      if (shouldCommit) {
        const outMs = Math.max(120, Math.round((1 - progress) * FLIP_OUT_MS));
        setManualAnimMs(outMs);
        setFlipPhase('manual-out');
        const outTimer = setTimeout(() => {
          applyMonthShift(motion);
          setManualRelease(null);
          setFlipPhase('flip-in');
          const inTimer = setTimeout(() => {
            setFlipPhase('');
            setManualAnimMs(0);
            isFlippingRef.current = false;
          }, FLIP_IN_MS);
          flipTimersRef.current.push(inTimer);
        }, outMs);
        flipTimersRef.current.push(outTimer);
        return;
      }

      const cancelMs = Math.max(120, Math.round(Math.max(progress, 0.12) * FLIP_OUT_MS));
      setManualAnimMs(cancelMs);
      setFlipPhase('manual-cancel');
      const cancelTimer = setTimeout(() => {
        setFlipPhase('');
        setManualRelease(null);
        setManualAnimMs(0);
        isFlippingRef.current = false;
      }, cancelMs);
      flipTimersRef.current.push(cancelTimer);
    },
    [applyMonthShift]
  );

  const handleManualCornerUp = useCallback(
    (e) => {
      endManualCornerFlip(e, false);
    },
    [endManualCornerFlip]
  );

  const handleManualCornerCancel = useCallback(
    (e) => {
      endManualCornerFlip(e, true);
    },
    [endManualCornerFlip]
  );

  const handleDateClick = useCallback(
    (date) => {
      if (!rangeStart) {
        setRangeStart(date);
        setRangeEnd(null);
      } else if (!rangeEnd) {
        if (isSameDay(date, rangeStart)) {
          setRangeStart(null);
          setRangeEnd(null);
          return;
        } else if (date < rangeStart) {
          setRangeEnd(rangeStart);
          setRangeStart(date);
        } else {
          setRangeEnd(date);
        }
      } else {
        if (isSameDay(date, rangeEnd)) {
          setRangeEnd(null);
          return;
        }
        setRangeStart(date);
        setRangeEnd(null);
      }
    },
    [rangeStart, rangeEnd]
  );
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      saveTheme(next);
      return next;
    });
  }, []);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevMonth();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNextMonth();
          break;
        case 'Escape':
          e.preventDefault();
          if (showYearView) {
            setShowYearView(false);
          } else {
            setRangeStart(null);
            setRangeEnd(null);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevMonth, goToNextMonth, showYearView]);

  const manualVisualState = manualFlip.active ? manualFlip : manualRelease;
  const manualProgress = manualVisualState ? manualVisualState.progress : 0;
  const manualMotion = manualVisualState ? manualVisualState.direction : flipDirection;
  const manualSign = manualMotion === 'next' ? -1 : 1;
  const manualYOffset = manualProgress * 3 * -manualSign;
  const showFlipUnderlay = Boolean(manualVisualState) || flipPhase === 'flip-out';
  const previewMotion = manualVisualState ? manualVisualState.direction : flipDirection;
  const previewMonthContext = useMemo(() => {
    if (!showFlipUnderlay) {
      return { year: currentYear, month: currentMonth };
    }
    return getShiftedMonthYear(currentYear, currentMonth, previewMotion);
  }, [showFlipUnderlay, currentYear, currentMonth, previewMotion]);
  const previewDays = useMemo(
    () => generateCalendarDays(previewMonthContext.year, previewMonthContext.month),
    [previewMonthContext.year, previewMonthContext.month]
  );
  const underlayOpacity = manualFlip.active ? Math.min(1, manualProgress * 1.45 + 0.08) : showFlipUnderlay ? 1 : 0;

  const sheetStyle = {
    '--manual-progress': `${manualProgress}`,
    '--manual-angle': `${(manualProgress * MAX_MANUAL_ROTATION_DEG * manualSign).toFixed(2)}deg`,
    '--manual-offset-y': `${manualYOffset.toFixed(2)}px`,
    '--manual-animation-ms': `${manualAnimMs}ms`,
  };
  const stackStyle = {
    '--underlay-opacity': `${underlayOpacity}`,
  };

  if (!mounted) {
    return <div className="calendar-loading" />;
  }

  return (
    <div className="calendar-page">
      
      <div className="top-bar">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          id="theme-toggle"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <div className={`theme-icon-wrapper ${theme}`}>
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </div>
        </button>
      </div>

      
      {rangeStart && (
        <div className="selection-bar" id="selection-bar">
          <div className="selection-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>
              {rangeEnd
                ? `${rangeStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${rangeEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : `${rangeStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} selected`}
              {rangeEnd && (() => {
                const days = Math.round(Math.abs(rangeEnd - rangeStart) / (1000 * 60 * 60 * 24)) + 1;
                return ` (${days} day${days > 1 ? 's' : ''})`;
              })()}
            </span>
          </div>
          <button
            className="clear-selection"
            onClick={() => { setRangeStart(null); setRangeEnd(null); }}
            id="btn-clear-selection"
          >
            ✕ Clear
          </button>
        </div>
      )}

      
      {showYearView && (
        <YearOverview
          year={currentYear}
          currentMonth={currentMonth}
          onMonthClick={goToMonth}
          onYearChange={(y) => setCurrentYear(y)}
          onClose={() => setShowYearView(false)}
        />
      )}

      
      <div className="calendar-card" id="calendar-card">
        <div className="spiral-binding" aria-hidden="true">
          {Array.from({ length: 15 }, (_, i) => (
            <div key={i} className="spiral-ring">
              <div className="spiral-ring-inner" />
            </div>
          ))}
        </div>

        <div className={['calendar-stack', showFlipUnderlay ? 'show-underlay' : ''].filter(Boolean).join(' ')} style={stackStyle}>
          <div className="calendar-underlay" aria-hidden="true">
            <div className="underlay-main">
              <div className="underlay-hero">
                <img src={MONTH_IMAGES[previewMonthContext.month]} alt="" draggable={false} />
                <div className="underlay-month-chip">
                  <span>{previewMonthContext.year}</span>
                  <strong>{MONTH_NAMES[previewMonthContext.month]}</strong>
                </div>
              </div>
              <div className="underlay-nav-strip">
                {MONTH_NAMES[previewMonthContext.month]} {previewMonthContext.year}
              </div>
              <div className="underlay-grid">
                <div className="underlay-day-headers">
                  {DAY_NAMES.map((name) => (
                    <div key={name} className="underlay-day-header">
                      {name}
                    </div>
                  ))}
                </div>
                <div className="underlay-days">
                  {previewDays.map((dayObj, index) => (
                    <div key={`${dayObj.date.getTime()}-${index}`} className={`underlay-day ${dayObj.isCurrentMonth ? 'current' : 'other'}`}>
                      {dayObj.day}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="underlay-sidebar">
              <div className="underlay-sidebar-header">Notes</div>
              <div className="underlay-sidebar-month">{MONTH_NAMES[previewMonthContext.month]}</div>
              <div className="underlay-sidebar-card" />
            </div>
          </div>

          <div
            className={['calendar-sheet', manualFlip.active ? 'manual-active' : '', showYearView ? 'card-dimmed' : '', flipPhase, `flip-${flipDirection}`].filter(Boolean).join(' ')}
            style={sheetStyle}
          >
            <div className="calendar-main">
              <CalendarHeader
                year={currentYear}
                month={currentMonth}
                onPrev={goToPrevMonth}
                onNext={goToNextMonth}
                onToday={goToToday}
                onOpenYearView={() => setShowYearView(true)}
              />
              <CalendarGrid
                year={currentYear}
                month={currentMonth}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onDateClick={handleDateClick}
                onOverflowDateClick={handleOverflowDateClick}
                noteDates={noteDates}
                direction={direction}
              />
            </div>

            <div className="calendar-sidebar">
              <NotesPanel
                year={currentYear}
                month={currentMonth}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onNotesChange={refreshNoteDates}
              />
            </div>

            <button
              type="button"
              className="page-corner-handle corner-left"
              aria-label="Pull page corner for previous month"
              onPointerDown={(e) => startManualCornerFlip('prev', e)}
              onPointerMove={handleManualCornerMove}
              onPointerUp={handleManualCornerUp}
              onPointerCancel={handleManualCornerCancel}
            />
            <button
              type="button"
              className="page-corner-handle corner-right"
              aria-label="Pull page corner for next month"
              onPointerDown={(e) => startManualCornerFlip('next', e)}
              onPointerMove={handleManualCornerMove}
              onPointerUp={handleManualCornerUp}
              onPointerCancel={handleManualCornerCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
