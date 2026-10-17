export type Cleanup = () => void;

export function mountComponents<T extends HTMLElement>(
	selector: string,
	initialize: (element: T) => Cleanup,
	hot?: { dispose(callback: Cleanup): void },
): Cleanup {
	const mounted = new Map<T, Cleanup>();
	function unmount() {
		mounted.forEach((cleanup) => cleanup());
		mounted.clear();
	}
	function mount() {
		for (const [element, cleanup] of mounted) {
			if (!element.isConnected) {
				cleanup();
				mounted.delete(element);
			}
		}
		document.querySelectorAll<T>(selector).forEach((element) => {
			if (!mounted.has(element)) mounted.set(element, initialize(element));
		});
	}
	function dispose() {
		document.removeEventListener('astro:page-load', mount);
		document.removeEventListener('astro:before-swap', unmount);
		unmount();
	}
	document.addEventListener('astro:page-load', mount);
	document.addEventListener('astro:before-swap', unmount);
	mount();
	hot?.dispose(dispose);
	return dispose;
}
