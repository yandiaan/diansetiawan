import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { mountComponents } from '../src/scripts/shared/mount.ts';

const previousDocument = globalThis.document;
let roots;
let dispose;

beforeEach(() => {
	roots = [{ isConnected: true }];
	globalThis.document = Object.assign(new EventTarget(), { querySelectorAll: () => roots });
});
afterEach(() => {
	dispose?.();
	globalThis.document = previousDocument;
});

test('initializes once when page-load runs more than once', () => {
	let initialized = 0;
	dispose = mountComponents('.component', () => { initialized++; return () => {}; });
	document.dispatchEvent(new Event('astro:page-load'));
	document.dispatchEvent(new Event('astro:page-load'));
	assert.equal(initialized, 1);
});

test('disposes before a page swap and mounts the replacement once', () => {
	let initialized = 0;
	let cleaned = 0;
	dispose = mountComponents('.component', () => {
		initialized++;
		return () => { cleaned++; };
	});
	document.dispatchEvent(new Event('astro:before-swap'));
	assert.equal(cleaned, 1);
	roots = [{ isConnected: true }];
	document.dispatchEvent(new Event('astro:page-load'));
	assert.equal(initialized, 2);
	dispose();
	assert.equal(cleaned, 2);
	document.dispatchEvent(new Event('astro:page-load'));
	assert.equal(initialized, 2);
});

test('cleans up a detached element before mounting another one', () => {
	let cleaned = 0;
	dispose = mountComponents('.component', () => () => { cleaned++; });
	roots[0].isConnected = false;
	roots = [{ isConnected: true }];
	document.dispatchEvent(new Event('astro:page-load'));
	assert.equal(cleaned, 1);
});

test('hot replacement removes the previous owner and its page listeners', () => {
	let cleaned = 0;
	let hotCleanup;
	dispose = mountComponents('.component', () => () => { cleaned++; }, {
		dispose(callback) { hotCleanup = callback; },
	});
	hotCleanup();
	assert.equal(cleaned, 1);
	document.dispatchEvent(new Event('astro:page-load'));
	dispose();
	assert.equal(cleaned, 1);
});
