const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/blog",
  poweredByHeader: false,
  images: {
    // Cloudinary does the resizing (f_auto,q_auto,c_limit,w_<width>)
    loader: "custom",
    loaderFile: "./src/lib/cloudinary-loader.js",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Old addresses keep working. The base path is added automatically.
  async redirects() {
    return [
      // Articles and topics before docs/BLOG_ADMIN_SPEC.md step 15; the main site
      // may still link to /blog/posts/<slug>.
      { source: "/posts/:slug", destination: "/:slug", permanent: true },
      { source: "/tags/:slug", destination: "/tag/:slug", permanent: true },
      // Admin addresses before step 6.
      { source: "/login", destination: "/admin/login", permanent: true },
      { source: "/admin/dashboard", destination: "/admin", permanent: true },
      {
        source: "/admin/new-post",
        destination: "/admin/posts/new",
        permanent: true,
      },
      {
        source: "/admin/:id([a-f0-9]{24})/edit",
        destination: "/admin/posts/:id/edit",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
