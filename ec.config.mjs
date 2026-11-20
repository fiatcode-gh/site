import { defineEcConfig } from "astro-expressive-code";

/**
 * Code blocks as editor panes, in a light and a dark theme that switch with
 * the system colour scheme (a media query — no JavaScript, no data-theme).
 *
 * Both themes are built here from the page tokens in src/styles/global.css
 * so code uses the same three syntax colours as the rest of the site:
 * kw for keywords, str for strings, fn for functions and types, num for
 * constants, faint italic for comments. EC needs literal colours, so these
 * values are copies — change them together with the CSS tokens.
 */
const palette = {
  light: {
    raised: "#f6f8fa",
    chrome: "#f2f4f7",
    select: "#dce9fa",
    line: "#dde2e8",
    lineStrong: "#c4ccd6",
    fg: "#1d232b",
    muted: "#4b5563",
    faint: "#636c79",
    gutter: "#7d8692",
    fn: "#0b5cbf",
    str: "#2a7317",
    kw: "#ad420a",
    num: "#845300",
    active: "#0b5cbf",
  },
  dark: {
    raised: "#1d2027",
    chrome: "#111317",
    select: "#1e3049",
    line: "#2a2e37",
    lineStrong: "#3a404c",
    fg: "#d6dae1",
    muted: "#a3abb8",
    faint: "#8b94a4",
    gutter: "#6b7385",
    fn: "#74b6ff",
    str: "#a5d68f",
    kw: "#f2a55e",
    num: "#e6c47e",
    active: "#f2a55e",
  },
};

/** @param {"light" | "dark"} type */
function workspaceTheme(type) {
  const c = palette[type];
  return {
    name: `workspace-${type}`,
    type,
    colors: {
      "editor.background": c.raised,
      "editor.foreground": c.fg,
      "editor.selectionBackground": c.select,
      "editorLineNumber.foreground": c.gutter,
      "editorGroupHeader.tabsBackground": c.chrome,
      "editorGroupHeader.tabsBorder": c.line,
      "tab.activeBackground": c.raised,
      "tab.activeForeground": c.fg,
      "tab.inactiveForeground": c.muted,
      "tab.border": c.line,
      "titleBar.activeBackground": c.chrome,
      "titleBar.activeForeground": c.muted,
      "titleBar.border": c.line,
      "scrollbarSlider.background": `${c.lineStrong}99`,
      "scrollbarSlider.hoverBackground": c.lineStrong,
    },
    tokenColors: [
      {
        scope: ["comment", "punctuation.definition.comment"],
        settings: { foreground: c.faint, fontStyle: "italic" },
      },
      {
        scope: ["string", "markup.inline.raw", "markup.inserted"],
        settings: { foreground: c.str },
      },
      {
        scope: [
          "keyword",
          "storage",
          "variable.language",
          "entity.name.tag",
          "support.type.property-name",
          "markup.heading",
          "markup.deleted",
        ],
        settings: { foreground: c.kw },
      },
      {
        scope: [
          "entity.name.function",
          "support.function",
          "entity.name.command",
          "entity.name.type",
          "entity.name.class",
          "support.class",
          "support.type",
          "entity.other.attribute-name",
          "markup.underline.link",
        ],
        settings: { foreground: c.fn },
      },
      {
        scope: [
          "constant",
          "support.constant",
          "variable.other.constant",
          "variable.other.enummember",
        ],
        settings: { foreground: c.num },
      },
      {
        scope: [
          "punctuation",
          "meta.brace",
          "keyword.operator",
          "string.unquoted.argument",
        ],
        settings: { foreground: c.muted },
      },
      { scope: ["markup.bold"], settings: { fontStyle: "bold" } },
      { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
    ],
  };
}

/** `[dark, light]` — the order Expressive Code's style overrides expect. */
const both = (/** @type {keyof typeof palette.light} */ key) => [
  palette.dark[key],
  palette.light[key],
];

export default defineEcConfig({
  // Light first: it is the base; the media query swaps in the dark theme.
  themes: [workspaceTheme("light"), workspaceTheme("dark")],
  useDarkModeMediaQuery: true,
  themeCssSelector: false,
  styleOverrides: {
    borderRadius: "10px",
    borderWidth: "1px",
    borderColor: both("line"),
    codeFontFamily: '"JetBrains Mono", ui-monospace, monospace',
    uiFontFamily: '"JetBrains Mono", ui-monospace, monospace',
    codeFontSize: "0.875rem",
    codeLineHeight: "1.7",
    codeBackground: both("raised"),
    codeForeground: both("fg"),
    codePaddingBlock: "1rem",
    codePaddingInline: "1.25rem",
    uiFontSize: "0.75rem",
    frames: {
      shadowColor: "transparent",
      frameBoxShadowCssValue: "none",
      editorActiveTabBackground: both("raised"),
      editorActiveTabForeground: both("fg"),
      editorActiveTabBorderColor: both("line"),
      editorActiveTabIndicatorTopColor: both("active"),
      editorActiveTabIndicatorBottomColor: "transparent",
      editorActiveTabIndicatorHeight: "2px",
      editorTabBarBackground: both("chrome"),
      editorTabBarBorderBottomColor: both("line"),
      editorBackground: both("raised"),
      terminalBackground: both("raised"),
      terminalTitlebarBackground: both("chrome"),
      terminalTitlebarForeground: both("muted"),
      terminalTitlebarBorderBottomColor: both("line"),
      terminalTitlebarDotsForeground: both("lineStrong"),
      terminalTitlebarDotsOpacity: "1",
      inlineButtonForeground: both("muted"),
      inlineButtonBorder: both("lineStrong"),
      tooltipSuccessBackground: both("str"),
      tooltipSuccessForeground: both("raised"),
    },
  },
});
