const posts = {
  welcome: {
    title: "Welcome to the Blog",
    date: "2026-08-26",
    content: `This is the first post on this blog. Future posts will cover
telecommunications infrastructure, electrical and electronic engineering
topics, and professional reflections.`,
  },
};

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = Object.hasOwn(posts, slug) ? posts[slug] : null;

  if (!post) {
    return <p>Post not found.</p>;
  }

  return (
    <article>
      <h1 className="text-2xl font-semibold">{post.title}</h1>
      <p className="text-sm text-gray-500 mt-1">{post.date}</p>
      <div className="prose prose-gray mt-6 whitespace-pre-line">
        {post.content}
      </div>
    </article>
  );
}
