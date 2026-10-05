export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** ?still skips the boot screen (used to capture the preview image) */
export const still = /[?&]still\b/.test(location.search);
