const posts = [
  {
    slug: "welcome",
    title: "Welcome to the Blog",
    date: "2026-08-26",
    excerpt:
      "An introduction to this space, where I will share notes on telecommunications, engineering, and professional experience.",
  },
];

export default function BlogHome() {
  return (
    <div className="space-y-10">
      {posts.map((post) => (
        <article key={post.slug}>
          <a href={`/blog/posts/${post.slug}`} className="block group">
            <h2 className="text-xl font-medium group-hover:text-gray-600">
              {post.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{post.date}</p>
            <p className="text-gray-700 mt-3">{post.excerpt}</p>
          </a>
        </article>
      ))}
    </div>
  );
}
