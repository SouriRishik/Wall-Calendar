'use client';

import { useMemo } from 'react';
import { MONTH_NAMES, MONTH_SHORT, generateCalendarDays, isToday, MONTH_IMAGES } from '@/utils/calendarUtils';
import './YearOverview.css';

export default function YearOverview({ year, currentMonth, onMonthClick, onYearChange, onClose }) {

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      index: i,
      name: MONTH_NAMES[i],
      short: MONTH_SHORT[i],
      days: generateCalendarDays(year, i),
      image: MONTH_IMAGES[i],
    }));
  }, [year]);

  return (
    <div className="year-overview-backdrop" onClick={onClose}>
      <div className="year-overview" onClick={(e) => e.stopPropagation()} id="year-overview">
        <div className="year-overview-header">
          <button
            className="year-nav-btn"
            onClick={() => onYearChange(year - 1)}
            aria-label="Previous year"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="year-overview-title">{year}</h2>
          <button
            className="year-nav-btn"
            onClick={() => onYearChange(year + 1)}
            aria-label="Next year"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="year-grid">
          {months.map((m) => (
            <button
              key={m.index}
              className={`year-month-card ${m.index === currentMonth ? 'current' : ''}`}
              onClick={() => onMonthClick(m.index)}
              id={`year-month-${m.index}`}
              style={{ animationDelay: `${m.index * 30}ms` }}
            >
              <div className="year-month-image">
                <img src={m.image} alt={m.name} loading="lazy" />
              </div>
              <div className="year-month-info">
                <span className="year-month-name">{m.short}</span>
                <div className="year-mini-grid">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <span key={i} className={`mini-header ${i >= 5 ? 'mini-weekend' : ''}`}>{d}</span>
                  ))}
                  {m.days.slice(0, 42).map((dayObj, idx) => (
                    <span
                      key={idx}
                      className={`mini-day ${!dayObj.isCurrentMonth ? 'mini-other' : ''} ${isToday(dayObj.date) ? 'mini-today' : ''}`}
                    >
                      {dayObj.isCurrentMonth ? dayObj.day : ''}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
