// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import expressiveCode from "astro-expressive-code";

import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  site: "https://fiatcode.dev",
  // Astro 7's default is 'jsx', which strips whitespace *between* adjacent
  // elements. Keep the HTML-aware compression instead: prose here routinely
  // sets an inline <span class="hl"> next to running text, and Prettier is
  // free to reflow that onto its own line. Under 'jsx' the reflow silently
  // deletes the space ("file input.Nothing leaves this tab."), which no test
  // catches and reading does not reveal.
  compressHTML: true,
  markdown: {
    // Astro 7 defaults to the Sätteri processor. The blog's posts and
    // Expressive Code both sit on the remark/rehype pipeline, so stay on
    // unified() to keep rendering identical. Porting to Sätteri is its own job.
    processor: unified(),
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    expressiveCode(),
    sitemap({ filter: (page) => !page.includes("/tools/cycle") }),
    svelte(),
  ],
});
