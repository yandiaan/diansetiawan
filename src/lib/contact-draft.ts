export interface ContactDraft {
	name: string;
	email: string;
	subject: string;
	enquiry: string;
	message: string;
}

export function buildContactDraft(recipient: string, draft: ContactDraft): string {
	const body = `Name: ${draft.name}\nEmail: ${draft.email}\nEnquiry: ${draft.enquiry}\n\n${draft.message}`;
	return `mailto:${recipient}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(body)}`;
}
