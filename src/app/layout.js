import './globals.css';

export const metadata = {
  title: 'Wall Calendar — Interactive Date Range Planner',
  description:
    'A beautiful, interactive wall calendar component with date range selection, integrated notes, and responsive design. Features physical calendar aesthetics with spiral binding, hero imagery, and smooth animations.',
  keywords: ['calendar', 'date range', 'planner', 'notes', 'interactive', 'wall calendar'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f0ebe4" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
