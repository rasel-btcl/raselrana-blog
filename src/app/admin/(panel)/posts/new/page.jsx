import PostEditor from "@/components/blog/PostEditor";
import {
  getAllTagNames,
  getCategories,
  getPostOptions,
} from "@/services/posts/queries";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  const [categories, tagSuggestions, postOptions] = await Promise.all([
    getCategories(),
    getAllTagNames(),
    getPostOptions(),
  ]);

  return (
    <>
      <h1 className="mb-8 font-display text-4xl font-semibold tracking-tight text-[var(--ink)]">
        New post
      </h1>
      <PostEditor
        categories={categories}
        tagSuggestions={tagSuggestions}
        postOptions={postOptions}
      />
    </>
  );
}
