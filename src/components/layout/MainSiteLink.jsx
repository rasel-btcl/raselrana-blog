/**
 * Link to the main site (raselrana.com.bd), which is a different app.
 * Root-relative on purpose and a plain <a>: next/link would put /blog in front.
 */
export default function MainSiteLink({ href, children, ...props }) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
