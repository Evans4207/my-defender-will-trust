import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { SELF_HELP_DISCLAIMER_SHORT } from "@/lib/legal";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-brand-navy-deep">
      <header className="mx-auto w-full max-w-md px-4 pt-10">
        <Link href="/" className="inline-flex text-white">
          <Logo href={null} />
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-md px-4 pb-8">
        <p className="text-center text-xs leading-relaxed text-white/50">
          {SELF_HELP_DISCLAIMER_SHORT}
        </p>
      </footer>
    </div>
  );
}
