import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildContactDraft } from '../src/lib/contact-draft.ts';

test('preserves punctuation, Unicode, and line breaks in an email draft', () => {
	const draft = buildContactDraft('me@diansetiawan.com', {
		name: 'Dian & team',
		email: 'hello+portfolio@example.com',
		subject: 'AI & Web3? Café #1',
		enquiry: 'AI Engineering',
		message: 'Hello Dian,\nLet’s build together: a=1&b=2.',
	});
	const url = new URL(draft);
	assert.equal(url.protocol, 'mailto:');
	assert.equal(url.pathname, 'me@diansetiawan.com');
	assert.equal(url.searchParams.get('subject'), 'AI & Web3? Café #1');
	assert.equal(url.searchParams.get('body'), 'Name: Dian & team\nEmail: hello+portfolio@example.com\nEnquiry: AI Engineering\n\nHello Dian,\nLet’s build together: a=1&b=2.');
});
