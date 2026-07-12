import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/role";
import { getUser } from "@/lib/auth/user";
import { Logo } from "@/components/brand/logo";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/admin", label: "Metrics" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/codes", label: "Access codes" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/state-rules", label: "State rules" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!(await isAdmin())) redirect("/dashboard");

  return (
    <div className="flex min-h-full flex-col">
      <header className="w-full border-b border-white/10 bg-brand-navy-deep text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
              Admin
            </span>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-8 sm:px-6">
        <nav className="hidden w-44 shrink-0 flex-col gap-1 sm:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
