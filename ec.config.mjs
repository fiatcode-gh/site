import { defineEcConfig } from "astro-expressive-code";

export default defineEcConfig({
  themes: ["dark-plus"],
  styleOverrides: {
    borderRadius: "0rem",
    frames: {
      shadowColor: "transparent",
    },
  },
});
