export function costOf(seconds: number, rate: number): number {
	return (seconds / 3600) * rate
}
