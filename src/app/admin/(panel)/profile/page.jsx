import AvatarField from "@/components/admin/AvatarField";
import Notice from "@/components/admin/Notice";
import { readNotice } from "@/lib/admin-action";
import { getCurrentUser } from "@/lib/authz";
import { buttonPrimary, fieldLabel, input } from "@/lib/ui";
import { getProfile, MIN_PASSWORD_LENGTH } from "@/services/users/profile";
import { redirect } from "next/navigation";
import { changePasswordAction, updateProfileAction } from "./actions";

export const metadata = { title: "Profile" };

const panel = "mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6";

const SOCIAL_FIELDS = [
  { name: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/in/…" },
  { name: "github", label: "GitHub", placeholder: "https://github.com/…" },
  { name: "facebook", label: "Facebook", placeholder: "https://www.facebook.com/…" },
  { name: "x", label: "X", placeholder: "https://x.com/…" },
];

export default async function ProfilePage({ searchParams }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const profile = await getProfile(user.id);
  const social = profile.socialLinks ?? {};

  return (
    <>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--ink)]">
        Profile
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-[var(--slate)]">
        Shown in the author box under every post and on your author page.
        Signed in as {profile.email}.
      </p>

      <Notice notice={readNotice(params)} />

      <section className={panel}>
        <h2 className="mb-5 font-display text-xl font-medium text-[var(--ink)]">
          About you
        </h2>
        <form action={updateProfileAction} className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className={fieldLabel}>Profile picture</p>
            <AvatarField initialUrl={profile.avatarUrl ?? ""} />
          </div>
          <div>
            <label htmlFor="profile-name" className={fieldLabel}>
              Name
            </label>
            <input
              id="profile-name"
              name="name"
              defaultValue={profile.name}
              maxLength={80}
              required
              className={input}
            />
          </div>
          <div>
            <label htmlFor="profile-username" className={fieldLabel}>
              Username
            </label>
            <input
              id="profile-username"
              name="username"
              defaultValue={profile.username}
              maxLength={40}
              required
              spellCheck={false}
              className={`${input} font-mono`}
            />
            <p className="mt-1.5 font-mono text-xs text-[var(--slate)]">
              /blog/author/{profile.username}
            </p>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="profile-bio" className={fieldLabel}>
              Bio
            </label>
            <textarea
              id="profile-bio"
              name="bio"
              defaultValue={profile.bio ?? ""}
              maxLength={600}
              rows={4}
              className={input}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="profile-website" className={fieldLabel}>
              Website
            </label>
            <input
              id="profile-website"
              name="website"
              type="url"
              defaultValue={profile.website ?? ""}
              placeholder="https://raselrana.com.bd"
              className={input}
            />
          </div>
          {SOCIAL_FIELDS.map((field) => (
            <div key={field.name}>
              <label htmlFor={`profile-${field.name}`} className={fieldLabel}>
                {field.label}
              </label>
              <input
                id={`profile-${field.name}`}
                name={field.name}
                type="url"
                defaultValue={social[field.name] ?? ""}
                placeholder={field.placeholder}
                className={input}
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <button type="submit" className={`${buttonPrimary} px-5 py-2.5`}>
              Save profile
            </button>
          </div>
        </form>
      </section>

      <section className={panel}>
        <h2 className="mb-2 font-display text-xl font-medium text-[var(--ink)]">
          Change password
        </h2>
        <p className="mb-5 text-sm text-[var(--slate)]">
          At least {MIN_PASSWORD_LENGTH} characters. Devices that are already
          signed in stay signed in.
        </p>
        <form action={changePasswordAction} className="grid max-w-xl gap-5">
          <div>
            <label htmlFor="password-current" className={fieldLabel}>
              Current password
            </label>
            <input
              id="password-current"
              name="current"
              type="password"
              autoComplete="current-password"
              required
              className={input}
            />
          </div>
          <div>
            <label htmlFor="password-next" className={fieldLabel}>
              New password
            </label>
            <input
              id="password-next"
              name="next"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              className={input}
            />
          </div>
          <div>
            <label htmlFor="password-confirm" className={fieldLabel}>
              New password again
            </label>
            <input
              id="password-confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              className={input}
            />
          </div>
          <div>
            <button type="submit" className={`${buttonPrimary} px-5 py-2.5`}>
              Change password
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
