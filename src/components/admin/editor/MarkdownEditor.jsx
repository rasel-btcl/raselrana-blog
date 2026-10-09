"use client";

import { markdown } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import CodeMirror from "@uiw/react-codemirror";
import { useEffect, useImperativeHandle, useRef } from "react";

// Colours come from the design tokens (globals.css), so the editor follows
// light and dark mode by itself.
const tokenTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--surface)",
    color: "var(--ink)",
    border: "1px solid var(--line)",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
  },
  "&.cm-focused": { outline: "none", borderColor: "var(--signal)" },
  ".cm-scroller": {
    fontFamily: "var(--font-mono)",
    lineHeight: "1.7",
    borderRadius: "0.5rem",
  },
  ".cm-content": { padding: "1rem 0", caretColor: "var(--ink)" },
  ".cm-line": { padding: "0 1rem" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--ink)" },
  ".cm-gutters": {
    backgroundColor: "var(--surface)",
    color: "var(--slate)",
    border: "none",
    borderRight: "1px solid var(--line)",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in srgb, var(--line) 30%, transparent)",
  },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--ink)" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
    { backgroundColor: "color-mix(in srgb, var(--signal) 28%, transparent)" },
  ".cm-placeholder": { color: "var(--slate)" },
});

const tokenHighlight = HighlightStyle.define([
  { tag: t.heading, color: "var(--code-title)", fontWeight: "600" },
  { tag: t.strong, fontWeight: "700" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: [t.link, t.url], color: "var(--signal)" },
  { tag: t.monospace, color: "var(--code-string)" },
  { tag: t.quote, color: "var(--slate)" },
  { tag: [t.processingInstruction, t.meta, t.contentSeparator], color: "var(--slate)" },
  { tag: t.keyword, color: "var(--code-keyword)" },
  { tag: [t.string, t.special(t.string)], color: "var(--code-string)" },
  { tag: [t.number, t.bool, t.atom], color: "var(--code-number)" },
  { tag: t.comment, color: "var(--code-comment)", fontStyle: "italic" },
]);

// ---- Edits used by the toolbar and the keyboard shortcuts ----

/** Put `block` at the cursor on lines of its own. */
function insertBlock(view, block) {
  const { from, to } = view.state.selection.main;
  const doc = view.state.doc;
  const before = doc.sliceString(Math.max(0, from - 2), from);
  const after = doc.sliceString(to, Math.min(doc.length, to + 2));

  const lead =
    from === 0 || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const tail = after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";

  view.dispatch({
    changes: { from, to, insert: lead + block + tail },
    selection: { anchor: from + lead.length + block.length },
    scrollIntoView: true,
  });
  view.focus();
  return true;
}

/** Wrap the selection in `marker` (e.g. ** for bold); with nothing selected, wrap a placeholder. */
function wrapSelection(view, marker, placeholder, closing = marker) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to) || placeholder;

  view.dispatch({
    changes: { from, to, insert: marker + selected + closing },
    selection: {
      anchor: from + marker.length,
      head: from + marker.length + selected.length,
    },
    scrollIntoView: true,
  });
  view.focus();
  return true;
}

/** Make the current line a heading (replacing any heading marks it already has). */
function setHeading(view, level) {
  const line = view.state.doc.lineAt(view.state.selection.main.head);
  const text = line.text.replace(/^#{1,6}\s+/, "");
  const prefix = `${"#".repeat(level)} `;

  view.dispatch({
    changes: { from: line.from, to: line.to, insert: prefix + text },
    selection: { anchor: line.from + prefix.length + text.length },
  });
  view.focus();
  return true;
}

const SAVE_EVENT = "markdown-editor-save";

// Created once, outside the component: the shortcuts do not depend on its state.
// Ctrl/Cmd+S announces itself with a DOM event that the component listens for.
const extensions = [
  markdown(),
  EditorView.lineWrapping,
  syntaxHighlighting(tokenHighlight),
  EditorView.contentAttributes.of({ "aria-label": "Content (Markdown)" }),
  Prec.highest(
    keymap.of([
      {
        key: "Mod-s",
        preventDefault: true,
        run: (view) => {
          view.dom.dispatchEvent(new CustomEvent(SAVE_EVENT, { bubbles: true }));
          return true;
        },
      },
      { key: "Mod-b", run: (view) => wrapSelection(view, "**", "bold text") },
      { key: "Mod-i", run: (view) => wrapSelection(view, "_", "italic text") },
    ]),
  ),
];

/**
 * The Markdown editor. `ref` exposes `insertBlock(text)`, `wrap(marker, placeholder,
 * closing)`, `heading(level)` and `focus()` for the toolbar.
 * Shortcuts: Ctrl/Cmd+S calls `onSave`, Ctrl/Cmd+B bold, Ctrl/Cmd+I italic.
 */
export default function MarkdownEditor({ ref, value, onChange, onSave, height = "70vh" }) {
  const viewRef = useRef(null);
  const wrapperRef = useRef(null);

  useImperativeHandle(ref, () => ({
    insertBlock: (block) => viewRef.current && insertBlock(viewRef.current, block),
    wrap: (marker, placeholder, closing) =>
      viewRef.current && wrapSelection(viewRef.current, marker, placeholder, closing),
    heading: (level) => viewRef.current && setHeading(viewRef.current, level),
    focus: () => viewRef.current?.focus(),
  }));

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !onSave) return;
    const handle = () => onSave();
    wrapper.addEventListener(SAVE_EVENT, handle);
    return () => wrapper.removeEventListener(SAVE_EVENT, handle);
  }, [onSave]);

  return (
    <div ref={wrapperRef}>
      <CodeMirror
        value={value}
        onChange={onChange}
        onCreateEditor={(view) => {
          viewRef.current = view;
        }}
        height={height}
        minHeight="24rem"
        theme={tokenTheme}
        extensions={extensions}
        placeholder="Write in Markdown…"
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          highlightSelectionMatches: false,
          autocompletion: false,
          searchKeymap: true,
        }}
      />
    </div>
  );
}
