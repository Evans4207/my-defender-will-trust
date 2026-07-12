import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield } from "@/components/brand/shield";
import { formatUsd, LAUNCH_PRICES } from "@/lib/pricing";
import { ATTORNEY_REVIEW_RECOMMENDATION } from "@/lib/legal";

const STEPS = [
  { n: "1", t: "Answer plain-English questions", d: "A guided interview—one question at a time. Autosaves as you go; leave and resume anytime." },
  { n: "2", t: "We assemble your documents", d: "State-specific clauses and execution instructions are built from your answers." },
  { n: "3", t: "Sign and store", d: "Download signing-ready documents with step-by-step instructions for your state." },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-brand-navy-deep text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 flex justify-center">
              <Shield className="h-16 w-auto text-accent" />
            </div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-accent">
              Protection Before Panic
            </p>
            <h1 className="text-balance font-serif text-4xl font-semibold leading-tight sm:text-5xl">
              Your Will &amp; Trust, done right—
              <span className="text-accent"> in every state.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-white/75">
              Create a state-compliant Last Will &amp; Testament or Revocable
              Living Trust through a simple, guided interview. Self-help document
              preparation for all 50 states plus DC.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                render={<Link href="/signup" />}
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-brand-gold-bright"
              >
                Get Started
              </Button>
              <Button
                render={<Link href="/states" />}
                size="lg"
                variant="outline"
                className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Check your state
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl font-semibold">
            Two ways to protect your family
          </h2>
          <p className="mt-3 text-muted-foreground">
            Pick the plan that fits. Not sure? Our interview recommends one for
            you.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-2">
            <CardHeader>
              <h3 className="font-serif text-2xl font-semibold">Will Package</h3>
              <p className="text-sm text-muted-foreground">
                Will + healthcare directive + HIPAA + financial POA
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-semibold">
                {formatUsd(LAUNCH_PRICES.will.individual)}
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  individual · {formatUsd(LAUNCH_PRICES.will.couples)} couples
                </span>
              </p>
              <Button render={<Link href="/signup" />} className="w-full">
                Start my Will
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-accent/60">
            <CardHeader>
              <h3 className="font-serif text-2xl font-semibold">
                Trust Package
              </h3>
              <p className="text-sm text-muted-foreground">
                Revocable living trust + pour-over will + directives + POA +
                funding guide
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-semibold">
                {formatUsd(LAUNCH_PRICES.trust.individual)}
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  individual · {formatUsd(LAUNCH_PRICES.trust.couples)} couples
                </span>
              </p>
              <Button
                render={<Link href="/signup" />}
                className="w-full bg-accent text-accent-foreground hover:bg-brand-gold-bright"
              >
                Start my Trust
              </Button>
            </CardContent>
          </Card>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Have an access code from a partner? Enter it after you create your
          account to unlock your discount.
        </p>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="mb-10 text-center font-serif text-3xl font-semibold">
            How it works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-navy text-lg font-semibold text-white">
                  {s.n}
                </div>
                <h3 className="font-serif text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-2xl rounded-lg border border-accent/40 bg-accent/10 p-5 text-center">
            <p className="text-sm font-medium">{ATTORNEY_REVIEW_RECOMMENDATION}</p>
          </div>
        </div>
      </section>
    </>
  );
}
