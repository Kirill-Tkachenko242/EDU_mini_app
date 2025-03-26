export function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay() + 1);

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
}

export function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Get the first Monday before the first day of the month if needed
  const start = new Date(firstDay);
  while (start.getDay() !== 1) {
    start.setDate(start.getDate() - 1);
  }

  const days: Date[] = [];
  const current = new Date(start);

  while (current <= lastDay || days.length % 7 !== 0) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}