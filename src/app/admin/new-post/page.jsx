import PostEditor from "@/components/blog/PostEditor";
import { getAllTagNames, getCategories } from "@/services/posts/queries";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  const [categories, tagSuggestions] = await Promise.all([
    getCategories(),
    getAllTagNames(),
  ]);

  return (
    <>
      <h1 className="mb-8 font-display text-4xl font-semibold tracking-tight text-[var(--ink)]">
        New post
      </h1>
      <PostEditor categories={categories} tagSuggestions={tagSuggestions} />
    </>
  );
}
