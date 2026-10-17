# Portfolio structure

The site uses Astro, TypeScript, and scoped CSS. No UI framework is required for its current interactions.

## Components

- `Layout.astro` owns the document, theme, global navbar, and contact dialog.
- `pages/index.astro` composes `Hero.astro` and `ExpertiseIntro.astro`.
- `Hero.astro` includes `HeroShader.astro` for the graphite surface background and `HeroPortrait.astro` for pointer-responsive portrait motion. Their controllers own animation cleanup and reduced-motion behavior.
- `Navbar.astro` owns the navigation panel. `RoleRotator.astro` and `ExpertiseTicker.astro` own their markup and styles.
- `ContactModal.astro` owns the contact form and includes `EnquirySelect.astro`.
- `icons/ArrowIcon.astro` shares the arrow shape and forwards attributes so parent scoped styles still apply.
- `data/portfolio.ts` contains profile details, navigation items, and enquiry options.

## Browser behavior

Each module in `src/scripts/` exports an initializer that accepts its component root and returns a cleanup function. Components register their initializer through `mountComponents`.

Mounting is idempotent for each element. Cleanup runs before an Astro page swap and during hot replacement. Event listeners use abort signals; observers, timers, and animation frames are explicitly disposed. Adding GSAP later should follow the same contract and revert its animation context during cleanup.

The menu and dialog share a reference-counted scroll lock. The dialog announces its opening so navigation can close and restore inert elements before the native modal opens.

`lib/hero-shader.ts` contains native WebGL shader sources for the original organic graphite folds, with broad, pronounced silver crests and slow domain warping. Pointer displacement remains restrained. The canvas has a soft 18 px blur (12 px on mobile) and a slight overscan to hide blurred edges. There are no particles or floating ornaments. `scripts/hero-shader.ts` owns the GPU program, buffer, uniforms, and context-loss recovery. A static CSS surface remains available when WebGL cannot initialize. The canvas fades in after its first draw and blends into the charcoal section below.

Shader rendering uses a full-screen triangle with no external rendering dependency. The drawing buffer is capped at approximately 700,000 pixels on desktop and 220,000 on mobile, with a 30/24 fps limit. Offscreen and hidden-tab rendering pauses; reduced motion draws a still composition and disables pointer displacement. Cleanup releases the program, shaders, buffer, observers, and animation frame.

`hero-light.ts` tracks a single silver spotlight across the headline's text spans using clipped CSS gradients. Text bounds are cached and invalidated on layout changes. Pointer updates are capped at 30 fps and stop after settling; coarse pointers, reduced motion, and hidden tabs retain the original text appearance.

The contact form opens a mail draft; `lib/contact-draft.ts` handles URL encoding. There is no server-side email submission.

## Checks

- Build: `npm run build`
- Regression tests, using Node 22.12 or newer: `node --experimental-strip-types --test tests/*.test.mjs`
- Browser checks: desktop and mobile hero; menu open/close and ticker; menu-to-contact transition; dropdown keyboard selection and Escape; textarea growth; body scroll and focus restoration.
