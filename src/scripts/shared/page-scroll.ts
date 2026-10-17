const locks = new Set<symbol>();
let restoreStyles: (() => void) | undefined;

export function lockPageScroll(): () => void {
	const lock = Symbol('page-scroll');
	if (locks.size === 0) {
		const body = document.body;
		const { overflow, paddingRight } = body.style;
		const scrollbar = window.innerWidth - document.documentElement.clientWidth;
		const padding = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
		body.style.overflow = 'hidden';
		body.style.paddingRight = `${padding + scrollbar}px`;
		restoreStyles = () => {
			body.style.overflow = overflow;
			body.style.paddingRight = paddingRight;
		};
	}
	locks.add(lock);
	return () => {
		if (!locks.delete(lock) || locks.size > 0) return;
		restoreStyles?.();
		restoreStyles = undefined;
	};
}
