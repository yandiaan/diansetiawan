export function initExpertiseTicker(ticker: HTMLElement): () => void {
	const controller = new AbortController();
	const { signal } = controller;
	const header = ticker.closest<HTMLElement>('.site-header')!;
	const track = ticker.querySelector<HTMLElement>('.ticker-track')!;
	const copy = ticker.querySelector<HTMLElement>('.ticker-copy')!;
	const reduced = matchMedia('(prefers-reduced-motion: reduce)');
	let copyWidth = copy.offsetWidth;
	let offset = 0;
	let lastTime = 0;
	let frame = 0;
	let lastX = 0;
	let distance = 0;
	let velocity = 0;
	let pointerTime = 0;
	let hovered = false;
	let dragging = false;

	function render() {
		if (copyWidth) offset = ((offset % copyWidth) + copyWidth) % copyWidth;
		track.style.transform = `translateX(${-offset}px)`;
	}
	function tick(time: number) {
		const delta = Math.min(time - lastTime || 16, 32);
		lastTime = time;
		if (!dragging && !hovered) {
			offset += (copyWidth / 60000 + velocity) * delta;
			velocity *= Math.pow(.94, delta / 16);
		}
		render();
		frame = requestAnimationFrame(tick);
	}
	function sync() {
		cancelAnimationFrame(frame);
		if (header.classList.contains('menu-open') && !reduced.matches && !document.hidden) {
			lastTime = 0;
			frame = requestAnimationFrame(tick);
		}
	}
	const visibilityObserver = new MutationObserver(sync);
	visibilityObserver.observe(header, { attributes: true, attributeFilter: ['class'] });
	const sizeObserver = new ResizeObserver(() => { copyWidth = copy.offsetWidth; });
	sizeObserver.observe(copy);
	reduced.addEventListener('change', sync, { signal });
	document.addEventListener('visibilitychange', sync, { signal });
	ticker.addEventListener('pointerenter', () => { hovered = true; }, { signal });
	ticker.addEventListener('pointerleave', () => { hovered = false; }, { signal });
	ticker.addEventListener('pointerdown', (event) => {
		if (event.button !== 0) return;
		dragging = true;
		lastX = event.clientX;
		distance = 0;
		velocity = 0;
		pointerTime = event.timeStamp;
	}, { signal });
	ticker.addEventListener('pointermove', (event) => {
		if (!dragging) return;
		const delta = lastX - event.clientX;
		distance += Math.abs(delta);
		if (distance > 5) ticker.setPointerCapture(event.pointerId);
		offset += delta;
		velocity = delta / Math.max(event.timeStamp - pointerTime, 1);
		lastX = event.clientX;
		pointerTime = event.timeStamp;
		render();
	}, { signal });
	window.addEventListener('pointerup', () => { dragging = false; }, { signal });
	window.addEventListener('pointercancel', () => { dragging = false; }, { signal });
	ticker.addEventListener('click', (event) => {
		if (distance <= 5) return;
		event.preventDefault();
		event.stopPropagation();
	}, { capture: true, signal });
	sync();

	return () => {
		controller.abort();
		cancelAnimationFrame(frame);
		visibilityObserver.disconnect();
		sizeObserver.disconnect();
	};
}
