import { format } from "date-fns";

export function money(value: number, currency = "TZS") {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function shortDate(value: string) {
  return format(new Date(value), "dd MMM yyyy");
}

export function monthLabel(value: string) {
  return format(new Date(`${value}-01`), "MMMM yyyy");
}
