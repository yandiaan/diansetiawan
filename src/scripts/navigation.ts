import { CONTACT_OPEN_EVENT } from './shared/events';
import { lockPageScroll } from './shared/page-scroll';

export function initNavigation(header: HTMLElement): () => void {
	const controller = new AbortController();
	const { signal } = controller;
	const panel = header.querySelector<HTMLElement>('.menu-panel')!;
	const heading = header.querySelector<HTMLElement>('.panel-heading')!;
	const content = header.querySelector<HTMLElement>('.menu-content')!;
	const toggle = header.querySelector<HTMLButtonElement>('.menu-toggle')!;
	const inertStates = new Map<HTMLElement, boolean>();
	let open = false;
	let releaseScroll: (() => void) | undefined;

	function measurePanel() {
		panel.style.setProperty('--open-height', `${heading.offsetHeight + content.offsetHeight}px`);
	}
	function setMenu(next: boolean, restoreFocus = true) {
		if (next === open) return;
		open = next;
		if (open) {
			releaseScroll = lockPageScroll();
			measurePanel();
			for (const element of document.body.children) {
				if (!(element instanceof HTMLElement) || element.contains(header)) continue;
				if (['SCRIPT', 'STYLE', 'LINK'].includes(element.tagName)) continue;
				inertStates.set(element, element.inert);
				element.inert = true;
			}
		} else {
			releaseScroll?.();
			releaseScroll = undefined;
			inertStates.forEach((previous, element) => { element.inert = previous; });
			inertStates.clear();
		}
		header.classList.toggle('menu-open', open);
		toggle.setAttribute('aria-expanded', String(open));
		toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
		content.inert = !open;
		content.setAttribute('aria-hidden', String(!open));
		if (!open && restoreFocus) toggle.focus({ preventScroll: true });
	}

	toggle.addEventListener('click', () => setMenu(!open), { signal });
	header.querySelector('.backdrop')!.addEventListener('click', () => setMenu(false), { signal });
	header.querySelectorAll('a').forEach((link) => {
		link.addEventListener('click', () => setMenu(false, false), { signal });
	});
	document.addEventListener(CONTACT_OPEN_EVENT, () => setMenu(false, false), { signal });
	document.addEventListener('keydown', (event) => {
		if (!open) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			setMenu(false);
		}
		if (event.key !== 'Tab') return;
		const items = [...panel.querySelectorAll<HTMLElement>('a, button')]
			.filter((element) => !element.closest('[inert]') && element.getClientRects().length);
		const first = items[0];
		const last = items.at(-1);
		if (!first || !last) return;
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}, { signal });
	const observer = new ResizeObserver(() => { if (open) measurePanel(); });
	observer.observe(content);
	observer.observe(heading);

	return () => {
		controller.abort();
		observer.disconnect();
		setMenu(false, false);
	};
}
