// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import expressiveCode from "astro-expressive-code";
import pagefind from "astro-pagefind";

import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  site: "https://fiatcode.dev",
  // Astro 7 changed the default to 'jsx', which drops whitespace *between*
  // adjacent elements. The current markup relies on those gaps (the footer's
  // "$ echo ..." row and the nav's "./" prefixes collapse without them), so
  // pin the v6 behaviour to keep this upgrade rendering-neutral. Markup written
  // from scratch can use explicit spacing and drop this.
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
    pagefind(),
    sitemap({ filter: (page) => !page.includes("/tools/cycle") }),
    svelte(),
  ],
});
