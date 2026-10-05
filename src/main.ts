// Entry point. Fonts and styles are bundled; the 3D scene (three.js) is a separate, lazily loaded chunk so the
// boot screen, navbar and 2D version work immediately, and a slow or failed download falls back to the 2D version.
import '@fontsource/chakra-petch/500.css';
import '@fontsource/chakra-petch/700.css';
import '@fontsource/share-tech-mono/400.css';
import './styles/index.css';
import { createApp } from './app';

const app = createApp();
let sceneLoaded = false;

// watchdog: if the 3D code hangs on a slow network, show the 2D version instead of a blank page
setTimeout(() => { if (!app.isBootReady() && !sceneLoaded) app.fallback('slow'); }, 6000);

// only a failed download falls back (like the old CDN script's onerror); errors inside the scene still surface
import('./scene/scene').then(
  ({ initScene }) => { sceneLoaded = true; initScene(app); },
  () => { app.fallback(); }
);
