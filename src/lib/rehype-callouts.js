import { visit } from "unist-util-visit";

const TITLES = { note: "Note", tip: "Tip", warning: "Warning" };
const MARKER = /^\[!(NOTE|TIP|WARNING)\][ \t]*\r?\n?/i;

/**
 * Turns a blockquote that starts with `[!NOTE]`, `[!TIP]` or `[!WARNING]`
 * (the syntax GitHub uses) into a callout box:
 *
 *     > [!WARNING]
 *     > Disconnect the battery first.
 *
 * becomes `<aside class="callout callout-warning">` with a title line.
 * Safe for client code (used by the editor preview as well).
 */
export default function rehypeCallouts() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "blockquote") return;

      const paragraph = node.children.find(
        (child) => child.type === "element" && child.tagName === "p",
      );
      const first = paragraph?.children[0];
      if (first?.type !== "text") return;

      const match = first.value.match(MARKER);
      if (!match) return;
      const kind = match[1].toLowerCase();

      // Remove the marker, and the line break that followed it.
      first.value = first.value.slice(match[0].length);
      if (!first.value) {
        paragraph.children.shift();
        if (paragraph.children[0]?.tagName === "br") paragraph.children.shift();
        const next = paragraph.children[0];
        if (next?.type === "text") next.value = next.value.replace(/^\r?\n/, "");
      }
      if (paragraph.children.length === 0) {
        node.children = node.children.filter((child) => child !== paragraph);
      }

      node.tagName = "aside";
      node.properties = { className: ["callout", `callout-${kind}`] };
      node.children.unshift({
        type: "element",
        tagName: "p",
        properties: { className: ["callout-title"] },
        children: [{ type: "text", value: TITLES[kind] }],
      });
    });
  };
}
