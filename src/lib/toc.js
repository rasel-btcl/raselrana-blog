import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

/**
 * `##` and `###` headings of a post as `{ id, text, depth }`.
 * Ids are produced the same way rehype-slug does in the renderer
 * (every heading goes through one slugger, in document order), so they match.
 */
export function getTableOfContents(markdown) {
  const tree = unified().use(remarkParse).parse(markdown);
  const slugger = new GithubSlugger();
  const items = [];

  visit(tree, "heading", (node) => {
    const text = toString(node, { includeImageAlt: false });
    const id = slugger.slug(text);
    if (node.depth === 2 || node.depth === 3) {
      items.push({ id, text, depth: node.depth });
    }
  });

  return items;
}
