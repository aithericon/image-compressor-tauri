const CURRENCY_LOCALE = 'en-US';
const DATE_LOCALE = 'en-US';

export function formatDuration(hours: number): string {
	const wholeHours = Math.floor(hours);
	const minutes = Math.round((hours - wholeHours) * 60);
	return `${wholeHours}h ${minutes}m`;
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
	return new Intl.NumberFormat(CURRENCY_LOCALE, {
		style: 'currency',
		currency
	}).format(amount);
}

export function formatMonth(date: Date): string {
	return new Intl.DateTimeFormat(DATE_LOCALE, {
		month: 'long',
		year: 'numeric'
	}).format(date);
}

export function formatShortMonth(date: Date): string {
	return new Intl.DateTimeFormat(DATE_LOCALE, {
		month: 'short'
	}).format(date);
}

export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat(DATE_LOCALE, {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	}).format(date);
}

export function formatDateTime(date: Date): string {
	return new Intl.DateTimeFormat(DATE_LOCALE, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(date);
}

export function formatTime(date: Date): string {
	return new Intl.DateTimeFormat(DATE_LOCALE, {
		hour: '2-digit',
		minute: '2-digit'
	}).format(date);
}
