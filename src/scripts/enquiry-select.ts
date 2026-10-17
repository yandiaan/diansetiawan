import { CONTACT_CLOSING_EVENT } from './shared/events';

export function initEnquirySelect(root: HTMLElement): () => void {
	const controller = new AbortController();
	const { signal } = controller;
	const trigger = root.querySelector<HTMLButtonElement>('.enquiry-trigger')!;
	const list = root.querySelector<HTMLElement>('.enquiry-options')!;
	const input = root.querySelector<HTMLInputElement>('.enquiry-input')!;
	const valueLabel = root.querySelector<HTMLElement>('#enquiry-value')!;
	const options = [...list.querySelectorAll<HTMLElement>('[role="option"]')];
	const dialog = root.closest<HTMLDialogElement>('dialog')!;
	const panel = dialog.querySelector<HTMLElement>('.contact-panel')!;
	let expanded = false;
	let selected = Math.max(0, options.findIndex((option) => option.dataset.value === input.value));
	let active = selected;
	let search = '';
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	function positionList() {
		const rect = trigger.getBoundingClientRect();
		const below = innerHeight - rect.bottom - 20;
		const above = rect.top - 20;
		const up = below < 280 && above > below;
		const maxHeight = Math.max(80, Math.min(304, (up ? above : below) - 8));
		list.style.width = `${rect.width}px`;
		list.style.maxHeight = `${maxHeight}px`;
		list.style.left = `${rect.left}px`;
		list.dataset.side = up ? 'top' : 'bottom';
		list.style.top = up ? 'auto' : `${rect.bottom + 8}px`;
		list.style.bottom = up ? `${innerHeight - rect.top + 8}px` : 'auto';
	}
	function activate(index: number, scroll = true) {
		active = (index + options.length) % options.length;
		options.forEach((option, i) => option.toggleAttribute('data-active', i === active));
		trigger.setAttribute('aria-activedescendant', options[active].id);
		if (scroll) options[active].scrollIntoView({ block: 'nearest' });
	}
	function setExpanded(next: boolean, focus = false) {
		if (next === expanded) return;
		expanded = next;
		trigger.setAttribute('aria-expanded', String(next));
		if (next) {
			positionList();
			list.showPopover();
			activate(selected);
		} else {
			if (list.matches(':popover-open')) list.hidePopover();
			trigger.removeAttribute('aria-activedescendant');
			clearTimeout(searchTimer);
			search = '';
		}
		if (focus) trigger.focus({ preventScroll: true });
	}
	function select(index: number) {
		selected = index;
		input.value = options[index].dataset.value!;
		valueLabel.textContent = input.value;
		options.forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.dispatchEvent(new Event('change', { bubbles: true }));
		setExpanded(false, true);
	}
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			if (!expanded) setExpanded(true);
			else activate(active + (event.key === 'ArrowDown' ? 1 : -1));
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (expanded) select(active); else setExpanded(true);
		} else if (event.key === 'Home' || event.key === 'End') {
			event.preventDefault();
			if (!expanded) setExpanded(true);
			activate(event.key === 'Home' ? 0 : options.length - 1);
		} else if (event.key === 'Tab') {
			setExpanded(false);
		} else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
			clearTimeout(searchTimer);
			search += event.key.toLowerCase();
			const index = options.findIndex((option) => option.dataset.value!.toLowerCase().startsWith(search));
			if (!expanded) setExpanded(true);
			if (index !== -1) activate(index);
			searchTimer = setTimeout(() => { search = ''; }, 600);
		}
	}

	trigger.addEventListener('click', () => setExpanded(!expanded), { signal });
	trigger.addEventListener('keydown', handleKeydown, { signal });
	trigger.addEventListener('blur', () => setExpanded(false), { signal });
	options.forEach((option, index) => {
		option.addEventListener('pointerdown', (event) => event.preventDefault(), { signal });
		option.addEventListener('pointermove', () => activate(index, false), { signal });
		option.addEventListener('click', () => select(index), { signal });
	});
	document.addEventListener('pointerdown', (event) => {
		if (expanded && !root.contains(event.target as Node)) setExpanded(false);
	}, { signal });
	document.addEventListener('keydown', (event) => {
		if (!expanded || event.key !== 'Escape') return;
		event.preventDefault();
		event.stopImmediatePropagation();
		setExpanded(false, true);
	}, { capture: true, signal });
	panel.addEventListener('scroll', () => { if (expanded) positionList(); }, { passive: true, signal });
	window.addEventListener('resize', () => { if (expanded) positionList(); }, { signal });
	dialog.addEventListener('close', () => setExpanded(false), { signal });
	dialog.addEventListener(CONTACT_CLOSING_EVENT, () => setExpanded(false), { signal });

	return () => {
		controller.abort();
		setExpanded(false);
		clearTimeout(searchTimer);
	};
}
