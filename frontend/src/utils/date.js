export function startOfWeek(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isoDate(d) {
  // Ensure we get YYYY-MM-DD format, handling timezone issues
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekForDate(targetDate) {
  // Calculate which week offset contains the target date
  // targetDate is a string in YYYY-MM-DD format
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Parse target date (YYYY-MM-DD format)
  const [year, month, day] = targetDate.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  target.setHours(0, 0, 0, 0);
  
  // Get Monday of current week (week 0)
  const currentWeekMonday = startOfWeek(0);
  currentWeekMonday.setHours(0, 0, 0, 0);
  
  // Get Monday of the week containing target date
  const targetDay = target.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysFromMonday = targetDay === 0 ? -6 : 1 - targetDay;
  const targetWeekMonday = new Date(target);
  targetWeekMonday.setDate(target.getDate() + daysFromMonday);
  targetWeekMonday.setHours(0, 0, 0, 0);
  
  // Calculate week offset
  const diffMs = targetWeekMonday.getTime() - currentWeekMonday.getTime();
  const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
  
  return diffWeeks;
}
