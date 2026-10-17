import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { lockPageScroll } from '../src/scripts/shared/page-scroll.ts';

const originalDocument = globalThis.document;
const originalWindow = globalThis.window;
let releases;

beforeEach(() => {
	globalThis.document = {
		body: { style: { overflow: 'auto', paddingRight: '8px' } },
		documentElement: { clientWidth: 1000 },
	};
	globalThis.window = {
		innerWidth: 1024,
		getComputedStyle: (element) => element.style,
	};
	releases = [];
});

afterEach(() => {
	releases.forEach((release) => release());
	globalThis.document = originalDocument;
	globalThis.window = originalWindow;
});

test('compensates for the scrollbar and restores the original body styles', () => {
	const release = lockPageScroll();
	releases.push(release);
	assert.equal(document.body.style.overflow, 'hidden');
	assert.equal(document.body.style.paddingRight, '32px');
	release();
	assert.equal(document.body.style.overflow, 'auto');
	assert.equal(document.body.style.paddingRight, '8px');
});

test('keeps scrolling locked until the last overlay releases it, in either order', () => {
	const releaseMenu = lockPageScroll();
	const releaseModal = lockPageScroll();
	releases.push(releaseMenu, releaseModal);
	releaseMenu();
	assert.equal(document.body.style.overflow, 'hidden');
	assert.equal(document.body.style.paddingRight, '32px');
	releaseModal();
	assert.equal(document.body.style.overflow, 'auto');

	const releaseFirst = lockPageScroll();
	const releaseSecond = lockPageScroll();
	releases.push(releaseFirst, releaseSecond);
	releaseSecond();
	assert.equal(document.body.style.overflow, 'hidden');
	releaseFirst();
	assert.equal(document.body.style.overflow, 'auto');
});

test('releasing a lock twice cannot unlock another overlay', () => {
	const first = lockPageScroll();
	const second = lockPageScroll();
	releases.push(first, second);
	first();
	first();
	assert.equal(document.body.style.overflow, 'hidden');
	second();
	assert.equal(document.body.style.overflow, 'auto');
});
