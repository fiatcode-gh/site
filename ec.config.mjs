import { defineEcConfig } from "astro-expressive-code";

export default defineEcConfig({
  // Vesper is a warm, amber-accented dark theme that suits the phosphor palette.
  themes: ["vesper"],
  styleOverrides: {
    borderRadius: "0rem",
    borderColor: "#39342e",
    codeFontFamily: '"Fira Code", ui-monospace, monospace',
    codeBackground: "#201d1a",
    frames: {
      shadowColor: "transparent",
      editorActiveTabBackground: "#201d1a",
      editorTabBarBackground: "#1a1816",
      editorBackground: "#201d1a",
      terminalBackground: "#201d1a",
      terminalTitlebarBackground: "#1a1816",
    },
  },
});
