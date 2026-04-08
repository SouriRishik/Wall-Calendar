

const HOLIDAYS = {
  '01-01': { name: "New Year's Day", emoji: '🎆' },
  '01-15': { name: 'Martin Luther King Jr. Day', emoji: '✊' },
  '02-14': { name: "Valentine's Day", emoji: '💝' },
  '02-17': { name: "Presidents' Day", emoji: '🇺🇸' },
  '03-17': { name: "St. Patrick's Day", emoji: '☘️' },
  '04-01': { name: "April Fools' Day", emoji: '🤡' },
  '05-05': { name: 'Cinco de Mayo', emoji: '🎉' },
  '05-12': { name: "Mother's Day", emoji: '💐' },
  '06-15': { name: "Father's Day", emoji: '👔' },
  '07-04': { name: 'Independence Day', emoji: '🎇' },
  '09-01': { name: 'Labor Day', emoji: '⚒️' },
  '10-31': { name: 'Halloween', emoji: '🎃' },
  '11-11': { name: "Veterans Day", emoji: '🎖️' },
  '11-27': { name: 'Thanksgiving', emoji: '🦃' },
  '12-25': { name: 'Christmas', emoji: '🎄' },
  '12-31': { name: "New Year's Eve", emoji: '✨' },
  '01-26': { name: 'Republic Day', emoji: '🇮🇳' },
  '08-15': { name: 'Independence Day (IN)', emoji: '🇮🇳' },
  '10-02': { name: 'Gandhi Jayanti', emoji: '🕊️' },
  '11-01': { name: 'Diwali (approx)', emoji: '🪔' },
  '03-29': { name: 'Holi (approx)', emoji: '🌈' },
};

export function getHoliday(date) {
  const key = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return HOLIDAYS[key] || null;
}

export function getHolidaysForMonth(month) {
  const monthStr = String(month + 1).padStart(2, '0');
  const result = [];
  for (const [key, value] of Object.entries(HOLIDAYS)) {
    if (key.startsWith(monthStr + '-')) {
      const day = parseInt(key.split('-')[1], 10);
      result.push({ day, ...value });
    }
  }
  return result;
}
