import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import moment from "moment"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date) {
  return moment(date).format('MMMM D, YYYY');
}

export function formatTime(date: Date) {
  return moment(date).format('h:mm A');
}

export function calculateDays(startDate: Date, endDate: Date) {
  return moment(endDate).diff(moment(startDate), 'days') + 1;
}