'use client';

import { useMemo, useCallback, useState } from 'react';
import {
  DAY_NAMES,
  generateCalendarDays,
  isSameDay,
  isToday,
  isInRange,
  isWeekend,
  dateToKey,
} from '@/utils/calendarUtils';
import { getHoliday } from '@/utils/holidays';
import './CalendarGrid.css';

export default function CalendarGrid({
  year,
  month,
  rangeStart,
  rangeEnd,
  onDateClick,
  onOverflowDateClick,
  noteDates,
  direction,
}) {
  const [hoverDate, setHoverDate] = useState(null);

  const days = useMemo(() => generateCalendarDays(year, month), [year, month]);

  const getDateClasses = useCallback(
    (dayObj) => {
      const classes = ['cal-day'];
      const { date, isCurrentMonth, isPrevMonth, isNextMonth } = dayObj;

      if (!isCurrentMonth) {
        classes.push('other-month');
        if (isPrevMonth) classes.push('prev-month');
        if (isNextMonth) classes.push('next-month');
        return classes.join(' ');
      }

      if (isToday(date)) classes.push('today');
      if (isWeekend(date)) classes.push('weekend');
      if (rangeStart && isSameDay(date, rangeStart)) {
        classes.push('range-start');
      }
      if (rangeEnd && isSameDay(date, rangeEnd)) {
        classes.push('range-end');
      }
      if (rangeStart && rangeEnd && !isSameDay(date, rangeStart) && !isSameDay(date, rangeEnd)) {
        if (isInRange(date, rangeStart, rangeEnd)) {
          classes.push('in-range');
        }
      }
      if (rangeStart && !rangeEnd && hoverDate && isCurrentMonth) {
        if (!isSameDay(date, rangeStart)) {
          if (isInRange(date, rangeStart, hoverDate)) {
            classes.push('hover-range');
          }
        }
      }
      const key = dateToKey(date);
      if (noteDates && noteDates[key]) {
        classes.push('has-note');
      }
      const holiday = getHoliday(date);
      if (holiday) {
        classes.push('has-holiday');
      }

      return classes.join(' ');
    },
    [rangeStart, rangeEnd, hoverDate, noteDates]
  );

  const handleMouseEnter = useCallback(
    (dayObj) => {
      if (dayObj.isCurrentMonth && rangeStart && !rangeEnd) {
        setHoverDate(dayObj.date);
      }
    },
    [rangeStart, rangeEnd]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverDate(null);
  }, []);

  const animClass = direction === 'next' ? 'grid-slide-left' : direction === 'prev' ? 'grid-slide-right' : 'grid-fade-in';

  return (
    <div className="calendar-grid-wrapper" id="calendar-grid">
      
      <div className="day-headers">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className={`day-header ${name === 'Sat' || name === 'Sun' ? 'weekend-header' : ''}`}
          >
            {name}
          </div>
        ))}
      </div>

      
      <div className={`days-grid ${animClass}`} key={`${year}-${month}`}>
        {days.map((dayObj, index) => {
          const holiday = dayObj.isCurrentMonth ? getHoliday(dayObj.date) : null;
          const key = dayObj.isCurrentMonth ? dateToKey(dayObj.date) : null;
          const hasNoteMarker = key && noteDates && noteDates[key];
          const dayLabel = `${dayObj.date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}${holiday ? ` - ${holiday.name}` : ''}`;

          return (
            <button
              key={`${dayObj.date.getTime()}-${index}`}
              className={getDateClasses(dayObj)}
              onClick={() => {
                if (dayObj.isCurrentMonth) {
                  onDateClick(dayObj.date);
                } else if (onOverflowDateClick) {
                  onOverflowDateClick(dayObj);
                }
              }}
              onMouseEnter={() => handleMouseEnter(dayObj)}
              onMouseLeave={handleMouseLeave}
              aria-label={dayLabel}
              id={dayObj.isCurrentMonth ? `day-${dayObj.day}` : undefined}
              title={holiday ? holiday.name : undefined}
            >
              <span className="day-number">{dayObj.day}</span>
              {holiday && (
                <span className="holiday-emoji" aria-hidden="true">
                  {holiday.emoji}
                </span>
              )}
              {hasNoteMarker && (
                <span className="note-dot" aria-label="Has note" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
