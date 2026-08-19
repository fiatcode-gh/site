import { defineEcConfig } from "astro-expressive-code";

/**
 * Code blocks on paper. `vitesse-light` is deliberately low-saturation,
 * which suits the brutalist palette and means the highlighting reads as
 * texture rather than decoration — the token colours are supplementary,
 * never the only way to tell code apart.
 *
 * Everything structural is overridden to match the site: square corners,
 * no shadows, 1px hairline borders in --rule-soft, the --code-bg surface,
 * and IBM Plex Mono.
 */
export default defineEcConfig({
  themes: ["vitesse-light"],
  // A single light theme; don't emit the dark-mode media query.
  themeCssSelector: false,
  useDarkModeMediaQuery: false,
  styleOverrides: {
    borderRadius: "0rem",
    borderWidth: "1px",
    borderColor: "rgb(0 0 0 / 0.25)",
    codeFontFamily: '"IBM Plex Mono", ui-monospace, monospace',
    codeFontSize: "0.8125rem",
    codeLineHeight: "1.7",
    codeBackground: "#f1ede2",
    codePaddingBlock: "0.75rem",
    codePaddingInline: "0.75rem",
    frames: {
      shadowColor: "transparent",
      editorActiveTabBackground: "#f1ede2",
      editorActiveTabIndicatorTopColor: "transparent",
      editorActiveTabIndicatorBottomColor: "#000",
      editorTabBarBackground: "#faf8f2",
      editorTabBarBorderBottomColor: "rgb(0 0 0 / 0.25)",
      editorBackground: "#f1ede2",
      terminalBackground: "#f1ede2",
      terminalTitlebarBackground: "#faf8f2",
      terminalTitlebarBorderBottomColor: "rgb(0 0 0 / 0.25)",
      terminalTitlebarDotsForeground: "rgb(0 0 0 / 0.4)",
      terminalTitlebarDotsOpacity: "1",
    },
  },
});
