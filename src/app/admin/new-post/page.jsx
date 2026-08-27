import PostEditor from "@/components/blog/PostEditor";

export default function NewPostPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-8">Create New Post</h1>
      <PostEditor />
    </main>
  );
}
