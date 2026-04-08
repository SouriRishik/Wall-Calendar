'use client';

import { useState } from 'react';
import { MONTH_NAMES, MONTH_IMAGES } from '@/utils/calendarUtils';
import './CalendarHeader.css';

export default function CalendarHeader({ year, month, onPrev, onNext, onToday, onOpenYearView }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageSrc = MONTH_IMAGES[month];

  return (
    <div className="calendar-header" id="calendar-header">
      <div className="hero-image-container">
        <img
          src={imageSrc}
          alt={`${MONTH_NAMES[month]} landscape`}
          className={`hero-image ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          draggable={false}
        />
        <div className="hero-overlay" />

        
        <button
          type="button"
          className="month-badge month-badge-button"
          onClick={onOpenYearView}
          id="btn-year-view"
          aria-label={`Open year overview for ${year}`}
          title="Open year overview"
        >
          <span className="month-badge-year">{year}</span>
          <span className="month-badge-month">{MONTH_NAMES[month]}</span>
        </button>
      </div>

      
      <div className="nav-controls">
        <button
          className="nav-btn nav-prev"
          onClick={onPrev}
          aria-label="Previous month"
          id="btn-prev-month"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          className="nav-btn nav-today"
          onClick={onToday}
          id="btn-today"
        >
          Today
        </button>

        <button
          className="nav-btn nav-next"
          onClick={onNext}
          aria-label="Next month"
          id="btn-next-month"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
