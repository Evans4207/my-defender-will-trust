import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/brand/logo";
import { Shield } from "@/components/brand/shield";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

/**
 * Internal design reference (not linked in nav, noindex). Renders the live theme
 * tokens from globals.css and the real UI components, so it always matches what
 * ships. Edit src/app/globals.css or the component files and this page reflects
 * it on refresh. Delete or gate before public launch if you don't want it around.
 */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

/** A color chip with a readable label and the class/token it maps to. */
function Swatch({
  className,
  name,
  token,
  ring,
}: {
  className: string;
  name: string;
  token: string;
  ring?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={`h-16 w-full rounded-lg ${className} ${ring ? "border border-border" : ""}`}
      />
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="font-mono text-xs text-muted-foreground">{token}</p>
      </div>
    </div>
  );
}

const BRAND_COLORS = [
  { className: "bg-brand-navy", name: "Navy", token: "brand-navy" },
  { className: "bg-brand-navy-deep", name: "Navy deep", token: "brand-navy-deep" },
  { className: "bg-brand-gold", name: "Gold", token: "brand-gold" },
  { className: "bg-brand-gold-bright", name: "Gold bright", token: "brand-gold-bright" },
];

const SEMANTIC_COLORS = [
  { className: "bg-background", name: "Background", token: "background", ring: true },
  { className: "bg-foreground", name: "Foreground", token: "foreground" },
  { className: "bg-card", name: "Card", token: "card", ring: true },
  { className: "bg-primary", name: "Primary", token: "primary" },
  { className: "bg-secondary", name: "Secondary", token: "secondary", ring: true },
  { className: "bg-accent", name: "Accent", token: "accent" },
  { className: "bg-muted", name: "Muted", token: "muted", ring: true },
  { className: "bg-destructive", name: "Destructive", token: "destructive" },
  { className: "bg-border", name: "Border", token: "border", ring: true },
];

const RADII = [
  { className: "rounded-sm", name: "sm" },
  { className: "rounded-md", name: "md" },
  { className: "rounded-lg", name: "lg" },
  { className: "rounded-xl", name: "xl" },
  { className: "rounded-2xl", name: "2xl" },
  { className: "rounded-3xl", name: "3xl" },
];

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

export default function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-14 px-6 py-12">
      {/* Header */}
      <header className="space-y-3">
        <Logo href={null} showTagline />
        <div>
          <h1 className="font-serif text-4xl font-semibold">Design system</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            The live theme and component library for My Defender Will &amp; Trust.
            Everything here renders from{" "}
            <code className="font-mono text-sm">src/app/globals.css</code> and{" "}
            <code className="font-mono text-sm">src/components</code> — change those
            and this page updates. Internal reference only (not in the nav, not
            indexed).
          </p>
        </div>
      </header>

      <Separator />

      {/* Brand palette */}
      <Section
        title="Brand colors"
        subtitle="Raw brand hues, expressed in oklch. Utilities: bg-brand-*, text-brand-*."
      >
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {BRAND_COLORS.map((c) => (
            <Swatch key={c.token} {...c} />
          ))}
        </div>
      </Section>

      {/* Semantic tokens */}
      <Section
        title="Semantic tokens"
        subtitle="What components actually reference. These flip automatically in dark mode."
      >
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {SEMANTIC_COLORS.map((c) => (
            <Swatch key={c.token} {...c} />
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section
        title="Typography"
        subtitle="Lora (serif) for display/headings, Source Sans for body, Geist Mono for code."
      >
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <p className="font-serif text-5xl font-semibold">Protection before panic</p>
          <p className="font-serif text-3xl font-semibold">Heading — serif 3xl</p>
          <p className="font-serif text-2xl font-semibold">Heading — serif 2xl</p>
          <p className="font-serif text-xl font-semibold">Heading — serif xl</p>
          <Separator />
          <p className="text-base">
            Body text in Source Sans. A guided, self-help way to create a
            state-compliant Last Will &amp; Testament or Revocable Living Trust in
            all 50 states plus DC.
          </p>
          <p className="text-sm text-muted-foreground">
            Muted small text — used for hints, descriptions, and captions.
          </p>
          <p className="font-mono text-sm">Geist Mono — DFND-XXXX-XXXX</p>
        </div>
      </Section>

      {/* Radius */}
      <Section title="Corner radius" subtitle="Scaled from --radius (0.625rem).">
        <div className="flex flex-wrap gap-5">
          {RADII.map((r) => (
            <div key={r.name} className="space-y-1.5 text-center">
              <div className={`size-20 bg-primary ${r.className}`} />
              <p className="font-mono text-xs text-muted-foreground">{r.name}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Buttons" subtitle="Variants, sizes, and disabled state.">
        <div className="space-y-6 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center gap-3">
            {BUTTON_VARIANTS.map((v) => (
              <Button key={v} variant={v}>
                {v[0].toUpperCase() + v.slice(1)}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </Section>

      {/* Cards */}
      <Section title="Cards" subtitle="The primary surface for grouped content.">
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg font-semibold">
                Will Package
              </CardTitle>
              <CardDescription>
                A state-compliant Last Will &amp; Testament with supporting documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Card body content sits here — pricing, details, whatever the screen needs.
            </CardContent>
            <CardFooter>
              <Button>Get started</Button>
            </CardFooter>
          </Card>

          <Card className="border-accent/60">
            <CardHeader>
              <CardTitle className="font-serif text-lg font-semibold">
                Trust Package
              </CardTitle>
              <CardDescription>
                A Revocable Living Trust, pour-over will, and supporting documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                Generated
              </span>
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                Recommended
              </span>
            </CardContent>
            <CardFooter>
              <Button className="bg-accent text-accent-foreground hover:bg-brand-gold-bright">
                Choose Trust
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Section>

      {/* Form controls */}
      <Section title="Form controls" subtitle="Inputs and labels as used in the interview.">
        <div className="max-w-md space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="space-y-1.5">
            <Label htmlFor="demo-name">Full legal name</Label>
            <Input id="demo-name" placeholder="Jane Doe" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demo-code">Access code</Label>
            <Input
              id="demo-code"
              placeholder="DFND-XXXX-XXXX"
              className="font-mono tracking-wider uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demo-disabled">Disabled field</Label>
            <Input id="demo-disabled" placeholder="Unavailable" disabled />
          </div>
        </div>
      </Section>

      {/* Alerts */}
      <Section title="Alerts" subtitle="Inline feedback — default and destructive.">
        <div className="space-y-4">
          <Alert>
            <AlertTitle>Access unlocked</AlertTitle>
            <AlertDescription>
              Your account is ready. Start your Will or Trust below.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              We couldn&apos;t redeem that code. Double-check it and try again.
            </AlertDescription>
          </Alert>
        </div>
      </Section>

      {/* Brand assets */}
      <Section title="Brand assets" subtitle="The shield motif and logo lockup.">
        <div className="space-y-6 rounded-xl border border-border bg-card p-6">
          <div className="flex items-end gap-8">
            <Shield className="h-10 w-auto text-accent" />
            <Shield className="h-16 w-auto text-accent" />
            <Shield className="h-24 w-auto text-brand-navy" />
          </div>
          <Separator />
          <div className="space-y-4">
            <Logo href={null} />
            <Logo href={null} showTagline />
          </div>
        </div>
      </Section>

      {/* Dark mode note */}
      <Section title="Dark mode" subtitle="The same tokens, inverted.">
        <div className="dark rounded-xl border border-border bg-background p-6 text-foreground">
          <div className="space-y-4">
            <p className="font-serif text-2xl font-semibold">Dark surface preview</p>
            <p className="text-sm text-muted-foreground">
              This block forces the <code className="font-mono">.dark</code> class so
              you can see the dark palette without switching your OS theme.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="outline">Outline</Button>
              <Button className="bg-accent text-accent-foreground">Accent</Button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {SEMANTIC_COLORS.slice(0, 8).map((c) => (
                <Swatch key={c.token} {...c} />
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
