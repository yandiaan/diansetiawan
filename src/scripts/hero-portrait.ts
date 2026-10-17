export function initHeroPortrait(portrait: HTMLElement): () => void {
	const controller = new AbortController();
	const { signal } = controller;
	const hero = portrait.closest<HTMLElement>('.hero')!;
	const image = portrait.querySelector<HTMLImageElement>('img')!;
	const reflection = portrait.querySelector<HTMLElement>('.portrait-reflection')!;
	const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
	const reduced = matchMedia('(prefers-reduced-motion: reduce)');
	const state = { x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0, proximity: 0, targetProximity: 0 };
	let frame = 0;
	let lastTime = 0;
	const clamp = (value: number) => Math.max(-1, Math.min(1, value));

	function render() {
		portrait.style.transform = `perspective(600px) translateY(${-state.proximity * 3}px) rotateX(${-state.y * 9}deg) rotateY(${state.x * 17}deg) rotateZ(${state.x * -1.2}deg) scale(${1 + state.proximity * .075})`;
		image.style.transform = `translate3d(${-state.x * 12}px,${-state.y * 7}px,0) scale(1.16)`;
		reflection.style.transform = `translate3d(${state.x * 32}%,${state.y * 14}%,0)`;
		reflection.style.opacity = String(.08 + state.proximity * .3);
	}
	function tick(time: number) {
		const delta = lastTime ? Math.min((time - lastTime) / 1000, 1 / 30) : 1 / 60;
		lastTime = time;
		// A critically damped spring returns to rest without overshooting the text around it.
		state.vx += (-100 * (state.x - state.targetX) - 20 * state.vx) * delta;
		state.vy += (-100 * (state.y - state.targetY) - 20 * state.vy) * delta;
		state.x += state.vx * delta;
		state.y += state.vy * delta;
		state.proximity += (state.targetProximity - state.proximity) * (1 - Math.exp(-delta * 10));
		render();
		const remaining = Math.abs(state.x - state.targetX) + Math.abs(state.y - state.targetY) + Math.abs(state.vx) + Math.abs(state.vy) + Math.abs(state.proximity - state.targetProximity);
		if (remaining > .0005) frame = requestAnimationFrame(tick);
		else { frame = 0; lastTime = 0; }
	}
	function wake() {
		if (!frame) frame = requestAnimationFrame(tick);
	}
	function reset() {
		state.targetX = state.targetY = state.targetProximity = 0;
		wake();
	}
	function syncPreference() {
		if (finePointer.matches && !reduced.matches && !document.hidden) return;
		cancelAnimationFrame(frame);
		frame = 0;
		lastTime = 0;
		state.x = state.y = state.vx = state.vy = state.targetX = state.targetY = state.proximity = state.targetProximity = 0;
		portrait.style.removeProperty('transform');
		image.style.removeProperty('transform');
		reflection.style.removeProperty('transform');
		reflection.style.removeProperty('opacity');
	}
	hero.addEventListener('pointermove', (event) => {
		if (!finePointer.matches || reduced.matches || event.pointerType !== 'mouse') return;
		const bounds = hero.getBoundingClientRect();
		const photo = portrait.getBoundingClientRect();
		const dx = event.clientX - (photo.left + photo.width / 2);
		const dy = event.clientY - (photo.top + photo.height / 2);
		const proximity = Math.max(0, 1 - Math.max(0, Math.hypot(dx, dy) - 70) / 300);
		const globalX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
		const globalY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
		state.targetX = clamp(globalX * .4 + clamp(dx / (photo.width * .5)) * proximity);
		state.targetY = clamp(globalY * .35 + clamp(dy / (photo.height * .6)) * proximity * .9);
		state.targetProximity = proximity;
		wake();
	}, { passive: true, signal });
	hero.addEventListener('pointerleave', reset, { signal });
	finePointer.addEventListener('change', syncPreference, { signal });
	reduced.addEventListener('change', syncPreference, { signal });
	document.addEventListener('visibilitychange', syncPreference, { signal });

	return () => {
		controller.abort();
		cancelAnimationFrame(frame);
		portrait.style.removeProperty('transform');
		image.style.removeProperty('transform');
		reflection.style.removeProperty('transform');
		reflection.style.removeProperty('opacity');
	};
}
