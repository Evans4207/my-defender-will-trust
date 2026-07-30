import type { Metadata } from "next";
import Link from "next/link";
import { groupedEntries, publishedEntries, draftCount } from "@/lib/faq/content";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "How My Defender Will & Trust works, what each package includes, what happens to your documents over time, and the limits of a self-help service.",
};

export default function FaqPage() {
  const groups = groupedEntries();
  const visible = publishedEntries();
  const pending = draftCount();
  const showingDrafts = visible.some((e) => e.reviewStatus === "draft");

  // FAQPage structured data. Only ever describes what is actually on the page.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: visible.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer.join(" ") },
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold">Frequently asked questions</h1>
      <p className="mt-3 text-muted-foreground">
        How this works, what you get, and what we can&apos;t do. If something here
        isn&apos;t clear, that&apos;s worth knowing before you start rather than
        after.
      </p>

      {showingDrafts && (
        <div className="mt-6 rounded-md border border-accent/50 bg-accent/10 p-4">
          <p className="text-sm">
            <span className="font-semibold">Pre-launch preview.</span> {pending}{" "}
            answer{pending === 1 ? "" : "s"} on this page {pending === 1 ? "has" : "have"}{" "}
            not been through legal review yet, and the wording will change. Nothing
            here is final. This notice and the unreviewed answers both disappear once
            they are approved.
          </p>
        </div>
      )}

      {groups.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          Our questions and answers are being reviewed and will appear here shortly.
          In the meantime, the{" "}
          <Link className="underline underline-offset-4" href="/find-an-attorney">
            find an attorney
          </Link>{" "}
          page lists the lawyer-referral service for your state.
        </p>
      ) : (
        <>
          {/* Jump list — the page is long by design. */}
          <nav className="mt-10 rounded-lg border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              On this page
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {groups.map((g) => (
                <li key={g.key}>
                  <a
                    className="text-sm underline-offset-4 hover:underline"
                    href={`#${g.key}`}
                  >
                    {g.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {groups.map((group) => (
            <section key={group.key} id={group.key} className="mt-12 scroll-mt-24">
              <h2 className="font-serif text-xl font-semibold">{group.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{group.blurb}</p>

              <dl className="mt-5 divide-y divide-border border-y border-border">
                {group.entries.map((entry) => (
                  <div key={entry.id} id={entry.id} className="scroll-mt-24 py-5">
                    <dt className="font-medium">{entry.question}</dt>
                    <dd className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
                      {entry.answer.map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </>
      )}

      <div className="mt-14 rounded-lg border border-border bg-muted/40 p-5">
        <h2 className="font-serif text-lg font-semibold">Still have a question?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          For anything about how the software works, we&apos;re happy to help. For a
          question about your own circumstances — what you should do, whether a
          choice is right for you — we can&apos;t answer it, and the honest thing is
          to say so and point you somewhere that can.
        </p>
        <Link
          className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
          href="/find-an-attorney"
        >
          Find an attorney in your state
        </Link>
      </div>

      <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
        My Defender Will &amp; Trust is not a law firm and does not provide legal
        advice. Nothing on this page is legal advice, and reading it does not create
        an attorney-client relationship. We recommend having a licensed attorney in
        your state review your documents before you sign them.
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
