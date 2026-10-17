# Portfolio structure

The site uses Astro, TypeScript, and scoped CSS. No UI framework is required for its current interactions.

## Components

- `Layout.astro` owns the document, theme, global navbar, and contact dialog.
- `pages/index.astro` composes `Hero.astro` and `ExpertiseIntro.astro`.
- `Navbar.astro` owns the navigation panel. `RoleRotator.astro` and `ExpertiseTicker.astro` own their markup and styles.
- `ContactModal.astro` owns the contact form and includes `EnquirySelect.astro`.
- `icons/ArrowIcon.astro` shares the arrow shape and forwards attributes so parent scoped styles still apply.
- `data/portfolio.ts` contains profile details, navigation items, and enquiry options.

## Browser behavior

Each module in `src/scripts/` exports an initializer that accepts its component root and returns a cleanup function. Components register their initializer through `mountComponents`.

Mounting is idempotent for each element. Cleanup runs before an Astro page swap and during hot replacement. Event listeners use abort signals; observers, timers, and animation frames are explicitly disposed. Adding GSAP later should follow the same contract and revert its animation context during cleanup.

The menu and dialog share a reference-counted scroll lock. The dialog announces its opening so navigation can close and restore inert elements before the native modal opens.

The contact form opens a mail draft; `lib/contact-draft.ts` handles URL encoding. There is no server-side email submission.

## Checks

- Build: `npm run build`
- Regression tests, using Node 22.12 or newer: `node --experimental-strip-types --test tests/*.test.mjs`
- Browser checks: desktop and mobile hero; menu open/close and ticker; menu-to-contact transition; dropdown keyboard selection and Escape; textarea growth; body scroll and focus restoration.
