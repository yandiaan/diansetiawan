export function initHeroLight(heading: HTMLElement): () => void {
	const controller = new AbortController();
	const { signal } = controller;
	const hero = heading.closest<HTMLElement>('.hero')!;
	const inks = [...heading.querySelectorAll<HTMLElement>('[data-light-ink]')];
	const pointer = matchMedia('(hover: hover) and (pointer: fine)');
	const reduced = matchMedia('(prefers-reduced-motion: reduce)');
	let bounds: DOMRect[] = [];
	let x = 0, y = 0, targetX = 0, targetY = 0;
	let strength = 0, targetStrength = 0;
	let frame = 0, lastTime = 0;
	let measured = false;

	function measure() {
		bounds = inks.map(ink => ink.getBoundingClientRect());
		measured = true;
	}
	function invalidate() { measured = false; }
	function tick(time: number) {
		if (lastTime && time - lastTime < 1000 / 30 - 1) {
			frame = requestAnimationFrame(tick);
			return;
		}
		const delta = lastTime ? Math.min(time - lastTime, 64) : 33;
		lastTime = time;
		const ease = 1 - Math.exp(-delta / 70);
		x += (targetX - x) * ease;
		y += (targetY - y) * ease;
		strength += (targetStrength - strength) * (1 - Math.exp(-delta / 120));
		if (Math.abs(targetStrength - strength) < .002) strength = targetStrength;
		if (!measured) measure();
		// Local coordinates keep one continuous light across separately aligned lines.
		inks.forEach((ink, index) => {
			ink.style.setProperty('--light-x', `${(x - bounds[index].left).toFixed(1)}px`);
			ink.style.setProperty('--light-y', `${(y - bounds[index].top).toFixed(1)}px`);
			ink.style.setProperty('--light-strength', strength.toFixed(3));
		});
		if (Math.abs(targetX - x) + Math.abs(targetY - y) > .2 || Math.abs(targetStrength - strength) > .002) {
			frame = requestAnimationFrame(tick);
		} else {
			frame = lastTime = 0;
		}
	}
	function wake() { if (!frame) frame = requestAnimationFrame(tick); }
	function leave() {
		if (!strength && !targetStrength) return;
		targetStrength = 0;
		wake();
	}
	function reset() {
		cancelAnimationFrame(frame);
		frame = lastTime = strength = targetStrength = 0;
		inks.forEach(ink => {
			ink.style.removeProperty('--light-x');
			ink.style.removeProperty('--light-y');
			ink.style.removeProperty('--light-strength');
		});
		invalidate();
	}
	function syncPreference() {
		if (!pointer.matches || reduced.matches || document.hidden) reset();
	}
	hero.addEventListener('pointermove', event => {
		if (!pointer.matches || reduced.matches || event.pointerType !== 'mouse') return;
		targetX = event.clientX;
		targetY = event.clientY;
		if (!strength) { x = targetX; y = targetY; }
		targetStrength = 1;
		wake();
	}, { passive: true, signal });
	hero.addEventListener('pointerleave', leave, { signal });
	// Entry transforms affect the initial geometry; refresh after they finish.
	heading.addEventListener('animationend', invalidate, { signal });
	window.addEventListener('scroll', () => { invalidate(); leave(); }, { passive: true, signal });
	window.addEventListener('resize', invalidate, { passive: true, signal });
	pointer.addEventListener('change', syncPreference, { signal });
	reduced.addEventListener('change', syncPreference, { signal });
	document.addEventListener('visibilitychange', syncPreference, { signal });
	const observer = new ResizeObserver(invalidate);
	observer.observe(heading);
	document.fonts.ready.then(() => { if (!signal.aborted) invalidate(); });
	return () => { controller.abort(); observer.disconnect(); reset(); };
}
