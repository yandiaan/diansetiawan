# Portfolio component refactor

**Goal:** Separate markup, interaction controllers, and shared profile data without changing the approved design or behavior. Keep Astro, TypeScript, scoped CSS, and the existing dependencies.

- [x] Extract shared profile data and SVG arrow; move the hero and expertise introduction out of the page.
- [x] Extract role rotation and the draggable ticker from navigation, retaining each component's scoped styles.
- [x] Move browser behavior into typed initializers with teardown for event listeners, animation frames, observers, and timers. Share scroll locking between menu and modal.
- [x] Add focused regression checks for nested scroll locks and contact draft encoding.
- [x] Build, check TypeScript, and verify desktop/mobile navigation, modal transitions, dropdown keyboard behavior, textarea, and clock in the browser.

Astro templates keep scoped styles. Browser controllers return cleanup functions and mount once per element; page replacement and hot reload dispose their resources. No React, Svelte, or GSAP is added by this refactor.
