import { cloudinarySrcSet, cloudinaryUrl } from "@/lib/cloudinary-loader";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

const IMAGE_WIDTHS = [480, 800, 1200, 1600];

function isExternal(href) {
  return (
    /^https?:\/\//i.test(href) &&
    !/^https?:\/\/(www\.)?raselrana\.com\.bd(\/|$)/i.test(href)
  );
}

const components = {
  // Links to other sites open in a new tab.
  a({ node, href = "", children, ...props }) {
    const external = isExternal(href);
    return (
      <a
        href={href}
        {...props}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
  img({ node, src, alt = "", ...props }) {
    if (!src) return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- size is unknown for Markdown images; Cloudinary does the resizing
      <img
        {...props}
        src={cloudinaryUrl(src, 1200)}
        srcSet={cloudinarySrcSet(src, IMAGE_WIDTHS)}
        sizes="(min-width: 768px) 720px, 100vw"
        alt={alt}
        loading="lazy"
        decoding="async"
      />
    );
  },
  // Wide tables scroll sideways inside their own box instead of widening the page.
  table({ node, children, ...props }) {
    return (
      <div className="table-scroll">
        <table {...props}>{children}</table>
      </div>
    );
  },
};

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeSlug, rehypeHighlight];

/**
 * The one Markdown renderer: used by the public post page (on the server) and by
 * the admin live preview (in the browser), so both always look the same.
 * Raw HTML in posts is not rendered. Wrap the output in an element with class "article".
 */
export default function Markdown({ children }) {
  return (
    <ReactMarkdown
      skipHtml
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}
