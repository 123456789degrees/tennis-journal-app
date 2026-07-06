import { defineConfig } from 'astro/config';

// Wireframe project — kept deliberately spare. Pages are .astro files in src/pages.
// wired-elements is loaded via <script> in the layout because it is a web component
// library; no integration needed.

export default defineConfig({
  site: 'http://localhost:4321',
});
