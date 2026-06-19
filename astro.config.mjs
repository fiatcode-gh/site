// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import expressiveCode from "astro-expressive-code";
import pagefind from "astro-pagefind";

import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  site: "https://fiatcode.dev",
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [expressiveCode(), pagefind(), sitemap({ filter: (page) => !page.includes("/tools/cycle") }), svelte()],
});
