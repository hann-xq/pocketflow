export function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDisplayDate(dateStr: string): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  if (dateStr === fmt(today)) return "Today";
  if (dateStr === fmt(yesterday)) return "Yesterday";

  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}
