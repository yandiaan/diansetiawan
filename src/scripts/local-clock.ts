export function initLocalClock(clock: HTMLTimeElement): () => void {
	const formatter = new Intl.DateTimeFormat('en-GB', {
		timeZone: clock.dataset.timeZone,
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	});
	function update() {
		const now = new Date();
		clock.dateTime = now.toISOString();
		clock.textContent = `${formatter.format(now)} WIB`;
	}
	update();
	const timer = setInterval(update, 60000);
	return () => clearInterval(timer);
}
