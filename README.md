# Wall Calendar

Wall Calendar is a Next.js app for browsing months, selecting date ranges, and writing notes tied to a month or specific dates.

## Features

- Month-by-month calendar navigation
- Date range selection with clear start, end, and in-range states
- Month notes and date notes saved in localStorage
- Note indicators on days that already have saved notes
- Light and dark theme toggle
- Keyboard support: left arrow, right arrow, and Escape
- Responsive layout for desktop, tablet, and mobile

## Tech Stack

- Next.js 16 (App Router)
- React with JavaScript
- Plain CSS
- localStorage for persistence

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install and Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```text
src/
    app/
        globals.css
        layout.js
        page.js
    components/
        CalendarApp/
        CalendarHeader/
        CalendarGrid/
        NotesPanel/
        YearOverview/
    utils/
        calendarUtils.js
        holidays.js
        storage.js
public/
    images/
```

## Notes Persistence

- Month notes use keys like `month-YYYY-MM`
- Date notes use keys like `date-YYYY-MM-DD`
- Date range notes use keys like `date-YYYY-MM-DD_to_YYYY-MM-DD`

## Keyboard Shortcuts

- Left Arrow: previous month
- Right Arrow: next month
- Escape: clear active selection

## License

MIT
