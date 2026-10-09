import { cloudinarySrcSet, cloudinaryUrl } from "@/lib/cloudinary-loader";
import { parseYouTubeUrl } from "@/lib/youtube";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import YouTubeEmbed from "./YouTubeEmbed";

const IMAGE_WIDTHS = [480, 800, 1200, 1600];
const GALLERY_WIDTHS = [320, 480, 720];

function isExternal(href) {
  return (
    /^https?:\/\//i.test(href) &&
    !/^https?:\/\/(www\.)?raselrana\.com\.bd(\/|$)/i.test(href)
  );
}

// ---- Looking at a paragraph's contents (hast nodes) ----

const isBlank = (node) =>
  (node.type === "text" && !node.value.trim()) ||
  (node.type === "element" && node.tagName === "br");

const meaningfulChildren = (node) => node.children.filter((c) => !isBlank(c));

/** The images of a paragraph that holds two or more images and nothing else. */
function galleryImages(node) {
  const children = meaningfulChildren(node);
  if (children.length < 2) return null;
  if (!children.every((c) => c.type === "element" && c.tagName === "img")) {
    return null;
  }
  return children
    .map((c) => ({ src: c.properties?.src, alt: c.properties?.alt ?? "" }))
    .filter((image) => typeof image.src === "string" && image.src);
}

/** The video of a paragraph that holds only a bare YouTube link. */
function soleYouTubeLink(node) {
  const children = meaningfulChildren(node);
  if (children.length !== 1) return null;

  const [link] = children;
  if (link.type !== "element" || link.tagName !== "a") return null;

  const href = link.properties?.href;
  if (typeof href !== "string") return null;

  // Only a pasted address counts; "[watch this](https://youtu.be/…)" stays a link.
  const text = link.children.map((c) => (c.type === "text" ? c.value : "")).join("");
  if (text.trim() !== href && `https://${text.trim()}` !== href) return null;

  return parseYouTubeUrl(href);
}

const components = {
  p({ node, children, ...props }) {
    const video = soleYouTubeLink(node);
    if (video) return <YouTubeEmbed id={video.id} start={video.start} />;

    // Photos placed together become a grid; each opens full size.
    const images = galleryImages(node);
    if (images?.length >= 2) {
      return (
        <div className="gallery" data-count={images.length}>
          {images.map((image, index) => (
            <a
              key={`${image.src}-${index}`}
              href={cloudinaryUrl(image.src, 1600)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary does the resizing */}
              <img
                src={cloudinaryUrl(image.src, 480)}
                srcSet={cloudinarySrcSet(image.src, GALLERY_WIDTHS)}
                sizes="(min-width: 768px) 240px, 50vw"
                alt={image.alt}
                loading="lazy"
                decoding="async"
              />
            </a>
          ))}
        </div>
      );
    }

    return <p {...props}>{children}</p>;
  },
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
 *
 * Two things go beyond plain Markdown:
 * - two or more images with no text between them render as a photo grid;
 * - a YouTube address on a line of its own renders as a click-to-play video.
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
