"use client";

import Link from "next/link";
import { useStepForm } from "@/lib/interview/use-step-form";
import { prevStepKey, type StepKey } from "@/lib/interview/steps";
import { US_STATES, STATE_NAMES } from "@/lib/interview/states";
import { COUPLES_TIER_OPEN } from "@/lib/features";
import { Button } from "@/components/ui/button";
import { WaitlistForm } from "@/components/waitlist-form";
import {
  Field,
  TextField,
  TextAreaField,
  SelectField,
  CheckboxField,
  RadioCards,
} from "./fields";
import { Repeatable } from "./repeatable";
import { StepNav } from "./step-nav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ReviewStep } from "./review-step";

type Answers = Record<string, Record<string, unknown>>;

// ---- small coercion helpers -------------------------------------------------
const str = (v: unknown) => (typeof v === "string" ? v : "");
const bool = (v: unknown) => v === true;
function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function prevHref(matterId: string, stepKey: StepKey): string | null {
  const p = prevStepKey(stepKey);
  return p ? `/interview/${matterId}/${p}` : null;
}

const STATE_OPTIONS = US_STATES.map((s) => ({ value: s.code, label: s.name }));

// =============================================================================
// State
// =============================================================================
function StateStep({
  matterId,
  initial,
  availableStates,
  userEmail,
}: {
  matterId: string;
  initial: Record<string, unknown>;
  availableStates: string[];
  userEmail: string;
}) {
  const f = useStepForm({ matterId, stepKey: "state", initial: { state: str(initial.state) } });
  const chosen = f.values.state;
  const unavailable = Boolean(chosen) && !availableStates.includes(chosen);

  return (
    <div className="space-y-6">
      <SelectField
        label="In which state do you live?"
        hint="This determines the legal rules that apply to your documents."
        value={chosen}
        onChange={(v) => f.setField("state", v)}
        options={STATE_OPTIONS}
      />

      {unavailable ? (
        <div className="space-y-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-4">
          <div>
            <h3 className="font-serif text-lg font-semibold">
              Not yet available in {STATE_NAMES[chosen] ?? "your state"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {chosen === "LA"
                ? "Louisiana is a civil-law jurisdiction with distinct will forms and forced-heirship rules, so it needs its own template set."
                : "We're finalizing legal review before offering documents in your state."}{" "}
              Join the waitlist and we&apos;ll email you the moment it opens.
            </p>
          </div>
          <WaitlistForm state={chosen} defaultEmail={userEmail} />
          <Button variant="ghost" render={<Link href="/dashboard" />}>
            Back to dashboard
          </Button>
        </div>
      ) : (
        <StepNav prevHref={prevHref(matterId, "state")} error={f.error} saving={f.saving} pending={f.pending} onContinue={f.submit} />
      )}
    </div>
  );
}

// =============================================================================
// Document type
// =============================================================================
function DocTypeStep({
  matterId,
  initial,
  docType,
}: {
  matterId: string;
  initial: Record<string, unknown>;
  docType: string;
}) {
  const f = useStepForm({
    matterId,
    stepKey: "doctype",
    initial: { doc_type: str(initial.doc_type) || docType || "will" },
  });
  // The document type is fixed by the package purchased; the other option is
  // shown for context but disabled.
  const options = [
    {
      value: "will",
      label: "Last Will & Testament",
      description:
        "Directs who receives your property and names guardians for minor children. Goes through probate.",
    },
    {
      value: "trust",
      label: "Revocable Living Trust",
      description:
        "Avoids probate and adds privacy; assets are retitled into a trust you control.",
    },
  ].map((o) => ({ ...o, disabled: o.value !== docType }));
  return (
    <div className="space-y-6">
      <Field
        label="Which document are you creating?"
        hint="Not sure? A will is the right starting point for most people."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((o) => {
            const selected = f.values.doc_type === o.value;
            return (
              <button
                type="button"
                key={o.value}
                disabled={o.disabled}
                onClick={() => !o.disabled && f.setField("doc_type", o.value)}
                className={cn(
                  "rounded-md border p-3 text-left transition-colors",
                  o.disabled && "cursor-not-allowed opacity-60",
                  selected ? "border-accent bg-accent/10 ring-1 ring-accent" : "border-input hover:bg-muted/40",
                )}
              >
                <span className="block text-sm font-medium">{o.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{o.description}</span>
              </button>
            );
          })}
        </div>
      </Field>
      <StepNav prevHref={prevHref(matterId, "doctype")} error={f.error} saving={f.saving} pending={f.pending} onContinue={f.submit} />
    </div>
  );
}

// =============================================================================
// About you
// =============================================================================
function AboutStep({ matterId, initial }: { matterId: string; initial: Record<string, unknown> }) {
  const f = useStepForm({
    matterId,
    stepKey: "about",
    initial: {
      fullName: str(initial.fullName),
      dob: str(initial.dob),
      address1: str(initial.address1),
      city: str(initial.city),
      state: str(initial.state),
      zip: str(initial.zip),
      maritalStatus: str(initial.maritalStatus),
      party: str(initial.party) || "individual",
      priorMarriages: bool(initial.priorMarriages),
      priorMarriagesDetail: str(initial.priorMarriagesDetail),
    },
  });
  return (
    <div className="space-y-5">
      <SelectField
        label="Who are these documents for?"
        hint={
          COUPLES_TIER_OPEN
            ? "Couples get mirror wills (or a joint trust) plus matching directives for each spouse or partner."
            : "Joint packages for couples are coming soon — each spouse will get their own login."
        }
        value={f.values.party}
        onChange={(v) => f.setField("party", v)}
        options={
          COUPLES_TIER_OPEN
            ? [
                { value: "individual", label: "Just me" },
                { value: "couples", label: "My spouse or partner and me" },
              ]
            : [{ value: "individual", label: "Just me" }]
        }
      />
      <TextField label="Full legal name" value={f.values.fullName} onChange={(v) => f.setField("fullName", v)} />
      <TextField label="Date of birth" type="date" value={f.values.dob} onChange={(v) => f.setField("dob", v)} />
      <TextField label="Street address" value={f.values.address1} onChange={(v) => f.setField("address1", v)} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="City" value={f.values.city} onChange={(v) => f.setField("city", v)} />
        <SelectField label="State" value={f.values.state} onChange={(v) => f.setField("state", v)} options={STATE_OPTIONS} />
        <TextField label="ZIP" value={f.values.zip} onChange={(v) => f.setField("zip", v)} />
      </div>
      <SelectField
        label="Marital status"
        value={f.values.maritalStatus}
        onChange={(v) => f.setField("maritalStatus", v)}
        options={[
          { value: "single", label: "Single" },
          { value: "married", label: "Married" },
          { value: "divorced", label: "Divorced" },
          { value: "widowed", label: "Widowed" },
        ]}
      />
      <CheckboxField
        label="I have been married before"
        hint="Prior marriages can affect spousal and children's rights."
        checked={f.values.priorMarriages}
        onChange={(v) => f.setField("priorMarriages", v)}
      />
      {f.values.priorMarriages && (
        <TextAreaField
          label="Tell us about prior marriages"
          value={f.values.priorMarriagesDetail}
          onChange={(v) => f.setField("priorMarriagesDetail", v)}
          placeholder="Former spouse(s), dates, and any children from those marriages."
        />
      )}
      <StepNav prevHref={prevHref(matterId, "about")} error={f.error} saving={f.saving} pending={f.pending} onContinue={f.submit} />
    </div>
  );
}

// =============================================================================
// Family
// =============================================================================
type Child = { name: string; dob: string; isMinor: boolean };

function FamilyStep({
  matterId,
  initial,
  context,
}: {
  matterId: string;
  initial: Record<string, unknown>;
  context: Answers;
}) {
  const couple = str(context.about?.party) === "couples";
  const married = str(context.about?.maritalStatus) === "married";
  const showSpouse = couple || married;
  const f = useStepForm({
    matterId,
    stepKey: "family",
    initial: {
      spouseName: str(initial.spouseName),
      children: arr<Child>(initial.children),
      dependents: str(initial.dependents),
    },
  });
  return (
    <div className="space-y-6">
      {showSpouse && (
        <TextField
          label={couple ? "Spouse or partner's full legal name" : "Spouse's full name"}
          hint={
            couple
              ? "Your documents and your spouse or partner's will be prepared together."
              : undefined
          }
          value={f.values.spouseName}
          onChange={(v) => f.setField("spouseName", v)}
        />
      )}
      <Field label="Children" hint="Include minors, adult children, and stepchildren you wish to provide for.">
        <Repeatable<Child>
          items={f.values.children}
          onChange={(next) => f.setField("children", next)}
          blank={() => ({ name: "", dob: "", isMinor: false })}
          addLabel="Add a child"
          emptyHint="No children added yet."
          renderItem={(c, update) => (
            <div className="space-y-2">
              <TextField label="Name" value={c.name} onChange={(v) => update({ name: v })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="Date of birth" type="date" value={c.dob} onChange={(v) => update({ dob: v })} />
                <div className="flex items-end">
                  <CheckboxField label="Minor (under 18)" checked={c.isMinor} onChange={(v) => update({ isMinor: v })} />
                </div>
              </div>
            </div>
          )}
        />
      </Field>
      <TextAreaField
        label="Other dependents (optional)"
        value={f.values.dependents}
        onChange={(v) => f.setField("dependents", v)}
        placeholder="Anyone else who depends on you financially."
      />
      <StepNav prevHref={prevHref(matterId, "family")} error={f.error} saving={f.saving} pending={f.pending} onContinue={f.submit} />
    </div>
  );
}

// =============================================================================
// Fiduciaries
// =============================================================================
function FiduciariesStep({
  matterId,
  initial,
  context,
  docType,
}: {
  matterId: string;
  initial: Record<string, unknown>;
  context: Answers;
  docType: string;
}) {
  const isTrust = docType === "trust";
  const hasMinor = arr<Child>(context.family?.children).some((c) => c.isMinor);
  const selfName = str(context.about?.fullName);
  const f = useStepForm({
    matterId,
    stepKey: "fiduciaries",
    initial: {
      executorName: str(initial.executorName),
      executorAlt: str(initial.executorAlt),
      guardianName: str(initial.guardianName),
      guardianAlt: str(initial.guardianAlt),
      trusteeName: str(initial.trusteeName) || (isTrust ? selfName : ""),
      successorTrusteeName: str(initial.successorTrusteeName),
      successorTrusteeAlt: str(initial.successorTrusteeAlt),
    },
  });
  return (
    <div className="space-y-6">
      {isTrust && (
        <div className="space-y-4 rounded-md border border-input p-4">
          <p className="text-sm font-medium">Trustees</p>
          <TextField
            label="Initial trustee"
            hint="Usually yourself while you're able to manage the trust."
            value={f.values.trusteeName}
            onChange={(v) => f.setField("trusteeName", v)}
          />
          <TextField
            label="Successor trustee"
            hint="Who takes over the trust if you can't serve."
            value={f.values.successorTrusteeName}
            onChange={(v) => f.setField("successorTrusteeName", v)}
          />
          <TextField
            label="Alternate successor trustee (optional)"
            value={f.values.successorTrusteeAlt}
            onChange={(v) => f.setField("successorTrusteeAlt", v)}
          />
        </div>
      )}
      <div className="space-y-4">
        <TextField
          label="Executor (personal representative)"
          hint={
            isTrust
              ? "Handles your pour-over will alongside the trust."
              : "The person who will carry out your will's instructions."
          }
          value={f.values.executorName}
          onChange={(v) => f.setField("executorName", v)}
        />
        <TextField label="Alternate executor (optional)" value={f.values.executorAlt} onChange={(v) => f.setField("executorAlt", v)} />
      </div>
      {hasMinor && (
        <div className="space-y-4 rounded-md border border-accent/40 bg-accent/5 p-4">
          <p className="text-sm font-medium">Guardian for your minor children</p>
          <TextField
            label="Guardian"
            hint="Who should raise your minor children if you cannot?"
            value={f.values.guardianName}
            onChange={(v) => f.setField("guardianName", v)}
          />
          <TextField label="Alternate guardian (optional)" value={f.values.guardianAlt} onChange={(v) => f.setField("guardianAlt", v)} />
        </div>
      )}
      <StepNav prevHref={prevHref(matterId, "fiduciaries")} error={f.error} saving={f.saving} pending={f.pending} onContinue={f.submit} />
    </div>
  );
}

// =============================================================================
// Assets
// =============================================================================
type RealEstate = { description: string; value: string };
type Account = { institution: string; kind: string };

function AssetsStep({
  matterId,
  initial,
  docType,
}: {
  matterId: string;
  initial: Record<string, unknown>;
  docType: string;
}) {
  const f = useStepForm({
    matterId,
    stepKey: "assets",
    initial: {
      realEstate: arr<RealEstate>(initial.realEstate),
      accounts: arr<Account>(initial.accounts),
      personalProperty: str(initial.personalProperty),
      business: str(initial.business),
    },
  });
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {docType === "trust"
          ? "List the assets you'll transfer into your trust. We'll build your funding checklist from these — a trust only works when it's funded."
          : "List assets of significance. You don't need to be exhaustive — this helps us tailor your documents."}
      </p>
      <Field label="Real estate">
        <Repeatable<RealEstate>
          items={f.values.realEstate}
          onChange={(next) => f.setField("realEstate", next)}
          blank={() => ({ description: "", value: "" })}
          addLabel="Add property"
          emptyHint="No real estate added."
          renderItem={(it, update) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Description" value={it.description} onChange={(v) => update({ description: v })} placeholder="e.g. Primary home, 123 Main St" />
              <TextField label="Approx. value (optional)" value={it.value} onChange={(v) => update({ value: v })} />
            </div>
          )}
        />
      </Field>
      <Field label="Financial accounts">
        <Repeatable<Account>
          items={f.values.accounts}
          onChange={(next) => f.setField("accounts", next)}
          blank={() => ({ institution: "", kind: "" })}
          addLabel="Add account"
          emptyHint="No accounts added."
          renderItem={(it, update) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Institution" value={it.institution} onChange={(v) => update({ institution: v })} />
              <TextField label="Type (optional)" value={it.kind} onChange={(v) => update({ kind: v })} placeholder="Checking, brokerage, 401(k)…" />
            </div>
          )}
        />
      </Field>
      <TextAreaField label="Business interests (optional)" value={f.values.business} onChange={(v) => f.setField("business", v)} />
      <TextAreaField label="Personal property of significance (optional)" value={f.values.personalProperty} onChange={(v) => f.setField("personalProperty", v)} placeholder="Vehicles, jewelry, collectibles, heirlooms." />
      <StepNav prevHref={prevHref(matterId, "assets")} error={f.error} saving={f.saving} pending={f.pending} onContinue={f.submit} />
    </div>
  );
}

// =============================================================================
// Distributions
// =============================================================================
type Beneficiary = { name: string; percent: string };
type Bequest = { item: string; recipient: string };

function DistributionsStep({ matterId, initial }: { matterId: string; initial: Record<string, unknown> }) {
  const f = useStepForm({
    matterId,
    stepKey: "distributions",
    initial: {
      beneficiaries: arr<Beneficiary>(initial.beneficiaries),
      distributionType: str(initial.distributionType),
      specificBequests: arr<Bequest>(initial.specificBequests),
      disinheritance: str(initial.disinheritance),
      charitable: str(initial.charitable),
    },
  });
  const total = f.values.beneficiaries.reduce((s, b) => s + (parseFloat(b.percent) || 0), 0);
  return (
    <div className="space-y-6">
      <Field label="Primary beneficiaries" hint="Who inherits your estate, and what share each receives. Shares must total 100%.">
        <Repeatable<Beneficiary>
          items={f.values.beneficiaries}
          onChange={(next) => f.setField("beneficiaries", next)}
          blank={() => ({ name: "", percent: "" })}
          addLabel="Add beneficiary"
          emptyHint="Add at least one beneficiary."
          renderItem={(b, update) => (
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
              <TextField label="Name" value={b.name} onChange={(v) => update({ name: v })} />
              <div className="space-y-1.5">
                <Label>Share %</Label>
                <Input type="number" min={0} max={100} value={b.percent} onChange={(e) => update({ percent: e.target.value })} />
              </div>
            </div>
          )}
        />
        <p className={cn("mt-2 text-sm", Math.round(total) === 100 ? "text-muted-foreground" : "text-destructive")}>
          Total allocated: {total}% {Math.round(total) === 100 ? "✓" : "(must equal 100%)"}
        </p>
      </Field>
      <RadioCards
        label="If a beneficiary dies before you, their share should…"
        hint="Per stirpes: pass to that person's descendants. Per capita: split among the surviving beneficiaries."
        value={f.values.distributionType}
        onChange={(v) => f.setField("distributionType", v)}
        options={[
          { value: "per_stirpes", label: "Pass to their children (per stirpes)", description: "Their descendants inherit their share." },
          { value: "per_capita", label: "Split among survivors (per capita)", description: "Divided among the remaining beneficiaries." },
        ]}
      />
      <Field label="Specific gifts (optional)" hint="Particular items left to particular people.">
        <Repeatable<Bequest>
          items={f.values.specificBequests}
          onChange={(next) => f.setField("specificBequests", next)}
          blank={() => ({ item: "", recipient: "" })}
          addLabel="Add specific gift"
          emptyHint="No specific gifts added."
          renderItem={(it, update) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Item" value={it.item} onChange={(v) => update({ item: v })} />
              <TextField label="Goes to" value={it.recipient} onChange={(v) => update({ recipient: v })} />
            </div>
          )}
        />
      </Field>
      <TextAreaField label="Charitable gifts (optional)" value={f.values.charitable} onChange={(v) => f.setField("charitable", v)} />
      <TextAreaField label="Disinheritance (optional)" hint="Anyone you specifically wish to exclude." value={f.values.disinheritance} onChange={(v) => f.setField("disinheritance", v)} />
      <StepNav prevHref={prevHref(matterId, "distributions")} error={f.error} saving={f.saving} pending={f.pending} onContinue={f.submit} />
    </div>
  );
}

// =============================================================================
// Special provisions
// =============================================================================
function SpecialStep({ matterId, initial }: { matterId: string; initial: Record<string, unknown> }) {
  const f = useStepForm({
    matterId,
    stepKey: "special",
    initial: {
      minorTrustAge: str(initial.minorTrustAge),
      petCare: bool(initial.petCare),
      petCareDetail: str(initial.petCareDetail),
      digitalAssets: bool(initial.digitalAssets),
      noContest: bool(initial.noContest),
    },
  });
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Hold minors&apos; inheritance until age (optional)</Label>
        <p className="text-xs text-muted-foreground">A minor&apos;s trust delays full access until the age you choose (18–35).</p>
        <Input type="number" min={18} max={35} value={f.values.minorTrustAge} onChange={(e) => f.setField("minorTrustAge", e.target.value)} className="max-w-[120px]" />
      </div>
      <CheckboxField label="Include a pet care provision" checked={f.values.petCare} onChange={(v) => f.setField("petCare", v)} />
      {f.values.petCare && (
        <TextAreaField label="Pet care details" value={f.values.petCareDetail} onChange={(v) => f.setField("petCareDetail", v)} placeholder="Caretaker and any funds set aside." />
      )}
      <CheckboxField label="Include a digital assets clause" hint="Grants your executor authority over online accounts and digital property." checked={f.values.digitalAssets} onChange={(v) => f.setField("digitalAssets", v)} />
      <CheckboxField label="Include a no-contest clause" hint="Discourages challenges to your will, where enforceable in your state." checked={f.values.noContest} onChange={(v) => f.setField("noContest", v)} />
      <StepNav prevHref={prevHref(matterId, "special")} error={f.error} saving={f.saving} pending={f.pending} onContinue={f.submit} />
    </div>
  );
}

// =============================================================================
// Ancillary documents
// =============================================================================
function AncillaryStep({ matterId, initial }: { matterId: string; initial: Record<string, unknown> }) {
  const f = useStepForm({
    matterId,
    stepKey: "ancillary",
    initial: {
      financialPoaAgent: str(initial.financialPoaAgent),
      healthcareAgent: str(initial.healthcareAgent),
      hipaaAuthorize: bool(initial.hipaaAuthorize),
    },
  });
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Your package includes these companion documents. State-specific statutory
        forms are used where they exist.
      </p>
      <TextField label="Financial power of attorney — agent" hint="Who can manage your finances if you're unable to." value={f.values.financialPoaAgent} onChange={(v) => f.setField("financialPoaAgent", v)} />
      <TextField label="Healthcare directive — agent" hint="Who can make medical decisions on your behalf." value={f.values.healthcareAgent} onChange={(v) => f.setField("healthcareAgent", v)} />
      <CheckboxField label="Include a HIPAA authorization" hint="Lets your agents access your medical information." checked={f.values.hipaaAuthorize} onChange={(v) => f.setField("hipaaAuthorize", v)} />
      <StepNav prevHref={prevHref(matterId, "ancillary")} error={f.error} saving={f.saving} pending={f.pending} onContinue={f.submit} continueLabel="Continue to review" />
    </div>
  );
}

// =============================================================================
// Dispatcher
// =============================================================================
export function StepRenderer({
  matterId,
  stepKey,
  answers,
  docType,
  availableStates,
  userEmail,
}: {
  matterId: string;
  stepKey: StepKey;
  answers: Answers;
  docType: string;
  availableStates: string[];
  userEmail: string;
}) {
  const initial = answers[stepKey] ?? {};
  switch (stepKey) {
    case "state":
      return (
        <StateStep
          matterId={matterId}
          initial={initial}
          availableStates={availableStates}
          userEmail={userEmail}
        />
      );
    case "doctype":
      return <DocTypeStep matterId={matterId} initial={initial} docType={docType} />;
    case "about":
      return <AboutStep matterId={matterId} initial={initial} />;
    case "family":
      return <FamilyStep matterId={matterId} initial={initial} context={answers} />;
    case "fiduciaries":
      return (
        <FiduciariesStep
          matterId={matterId}
          initial={initial}
          context={answers}
          docType={docType}
        />
      );
    case "assets":
      return <AssetsStep matterId={matterId} initial={initial} docType={docType} />;
    case "distributions":
      return <DistributionsStep matterId={matterId} initial={initial} />;
    case "special":
      return <SpecialStep matterId={matterId} initial={initial} />;
    case "ancillary":
      return <AncillaryStep matterId={matterId} initial={initial} />;
    case "review":
      return <ReviewStep matterId={matterId} answers={answers} />;
  }
}
