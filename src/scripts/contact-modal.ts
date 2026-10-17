import { buildContactDraft } from '../lib/contact-draft';
import { CONTACT_CLOSING_EVENT, CONTACT_OPEN_EVENT } from './shared/events';
import { lockPageScroll } from './shared/page-scroll';

const CLOSE_DURATION_MS = 300;

export function initContactModal(dialog: HTMLDialogElement): () => void {
	const controller = new AbortController();
	const { signal } = controller;
	const panel = dialog.querySelector<HTMLElement>('.contact-panel')!;
	const closeButton = dialog.querySelector<HTMLButtonElement>('.close-contact')!;
	const form = dialog.querySelector<HTMLFormElement>('form')!;
	const message = form.querySelector<HTMLTextAreaElement>('#contact-message')!;
	const count = form.querySelector<HTMLOutputElement>('#message-count')!;
	const reduced = matchMedia('(prefers-reduced-motion: reduce)');
	let opener: HTMLElement | null = null;
	let releaseScroll: (() => void) | undefined;
	let closing = false;
	let backdropPointer = false;
	let revealFrame = 0;
	let closeTimer: ReturnType<typeof setTimeout> | undefined;

	function resizeMessage() {
		message.style.height = 'auto';
		message.style.height = `${Math.min(288, Math.max(112, message.scrollHeight))}px`;
		message.style.overflowY = message.scrollHeight > 288 ? 'auto' : 'hidden';
		count.textContent = `${message.value.length.toLocaleString('en-US')} / 5,000`;
	}
	function reset() {
		cancelAnimationFrame(revealFrame);
		clearTimeout(closeTimer);
		dialog.classList.remove('is-visible');
		releaseScroll?.();
		releaseScroll = undefined;
		closing = false;
	}
	function openContact(trigger: HTMLElement) {
		if (dialog.open) return;
		document.dispatchEvent(new CustomEvent(CONTACT_OPEN_EVENT));
		opener = trigger;
		releaseScroll = lockPageScroll();
		dialog.showModal();
		resizeMessage();
		panel.scrollTop = 0;
		// Resolve the 95% starting scale before the reference's 300 ms transition.
		void panel.offsetWidth;
		revealFrame = requestAnimationFrame(() => dialog.classList.add('is-visible'));
	}
	function finishClose() {
		dialog.close();
		reset();
		const target = opener?.closest('[inert]')
			? document.querySelector<HTMLButtonElement>('.menu-toggle')
			: opener;
		target?.focus({ preventScroll: true });
	}
	function closeContact() {
		if (!dialog.open || closing) return;
		closing = true;
		dialog.dispatchEvent(new CustomEvent(CONTACT_CLOSING_EVENT));
		cancelAnimationFrame(revealFrame);
		dialog.classList.remove('is-visible');
		if (reduced.matches) finishClose();
		else closeTimer = setTimeout(finishClose, CLOSE_DURATION_MS);
	}

	document.addEventListener('click', (event) => {
		const trigger = event.target instanceof Element
			? event.target.closest<HTMLElement>('[data-contact-open]')
			: null;
		if (!trigger) return;
		event.preventDefault();
		openContact(trigger);
	}, { signal });
	closeButton.addEventListener('click', closeContact, { signal });
	dialog.addEventListener('cancel', (event) => {
		event.preventDefault();
		closeContact();
	}, { signal });
	dialog.addEventListener('close', reset, { signal });
	dialog.addEventListener('pointerdown', (event) => { backdropPointer = event.target === dialog; }, { signal });
	dialog.addEventListener('click', (event) => {
		if (backdropPointer && event.target === dialog) closeContact();
	}, { signal });
	message.addEventListener('input', resizeMessage, { signal });
	window.addEventListener('resize', () => { if (dialog.open) resizeMessage(); }, { signal });
	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const data = new FormData(form);
		const draft = {
			name: String(data.get('name') ?? '').trim(),
			email: String(data.get('email') ?? '').trim(),
			subject: String(data.get('subject') ?? '').trim(),
			enquiry: String(data.get('enquiry') ?? ''),
			message: String(data.get('message') ?? '').trim(),
		};
		if (!draft.name || !draft.email || !draft.subject || !draft.message) {
			form.reportValidity();
			return;
		}
		window.location.href = buildContactDraft(dialog.dataset.email!, draft);
	}, { signal });

	return () => {
		controller.abort();
		dialog.dispatchEvent(new CustomEvent(CONTACT_CLOSING_EVENT));
		if (dialog.open) dialog.close();
		reset();
	};
}
