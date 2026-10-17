export const profile = {
	name: 'Dian Setiawan',
	email: 'me@diansetiawan.com',
	timeZone: 'Asia/Jakarta',
	roles: ['Software Engineer', 'Blockchain Engineer', 'AI Engineer'],
} as const;

export const navigationItems = [
	{ label: 'Home', href: '#home' },
	{ label: 'About', href: '#about' },
	{ label: 'Projects', href: '#projects' },
	{ label: 'Experience', href: '#experience' },
	{ label: 'Contact', href: '#contact' },
] as const;

export const enquiryOptions = [
	{ title: 'General Enquiry', description: 'Questions, introductions, and collaboration.' },
	{ title: 'Software Engineering', description: 'Web applications, APIs, and product engineering.' },
	{ title: 'Blockchain Engineering', description: 'Smart contracts and decentralized applications.' },
	{ title: 'AI Engineering', description: 'AI integrations, agents, and intelligent products.' },
] as const;
