import { z } from "zod";
import type { StepKey } from "./steps";
import { isValidStateCode } from "./states";

/**
 * Per-step validation. Each step's answers are stored as a JSON blob in
 * interview_answers; these schemas validate a step before it counts as
 * "completed". Schemas are intentionally lenient on optional detail (a valid
 * will can omit assets) but strict on the essentials.
 */

const personName = z.string().trim().min(1, "Please enter a name.");

export const stateStepSchema = z.object({
  state: z
    .string()
    .refine((c) => isValidStateCode(c), "Please choose your state."),
});

export const doctypeStepSchema = z.object({
  doc_type: z.enum(["will", "trust"]),
});

export const aboutStepSchema = z.object({
  fullName: z.string().trim().min(1, "Please enter your full legal name."),
  dob: z.string().trim().min(1, "Please enter your date of birth."),
  address1: z.string().trim().min(1, "Please enter your street address."),
  city: z.string().trim().min(1, "Please enter your city."),
  state: z.string().refine(isValidStateCode, "Please choose a state."),
  zip: z.string().trim().min(3, "Please enter your ZIP code."),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]),
  // Whether documents are for one person or a couple (mirror wills / joint
  // trust). Drives the couples document package in generation.
  party: z.enum(["individual", "couples"]).default("individual"),
  priorMarriages: z.boolean().default(false),
  priorMarriagesDetail: z.string().trim().optional(),
});

export const familyStepSchema = z.object({
  spouseName: z.string().trim().optional(),
  children: z
    .array(
      z.object({
        name: personName,
        dob: z.string().trim().optional(),
        isMinor: z.boolean().default(false),
      }),
    )
    .default([]),
  dependents: z.string().trim().optional(),
});

export const fiduciariesStepSchema = z.object({
  executorName: z.string().trim().min(1, "Please name an executor."),
  executorAlt: z.string().trim().optional(),
  guardianName: z.string().trim().optional(),
  guardianAlt: z.string().trim().optional(),
  // Trust flow only (optional so the schema stays doc-type-agnostic).
  trusteeName: z.string().trim().optional(),
  successorTrusteeName: z.string().trim().optional(),
  successorTrusteeAlt: z.string().trim().optional(),
});

export const assetsStepSchema = z.object({
  realEstate: z
    .array(z.object({ description: personName, value: z.string().trim().optional() }))
    .default([]),
  accounts: z
    .array(z.object({ institution: personName, kind: z.string().trim().optional() }))
    .default([]),
  personalProperty: z.string().trim().optional(),
  business: z.string().trim().optional(),
});

export const distributionsStepSchema = z
  .object({
    beneficiaries: z
      .array(
        z.object({
          name: personName,
          percent: z.coerce.number().min(0).max(100),
        }),
      )
      .min(1, "Add at least one beneficiary."),
    distributionType: z.enum(["per_stirpes", "per_capita"]),
    specificBequests: z
      .array(z.object({ item: personName, recipient: personName }))
      .default([]),
    disinheritance: z.string().trim().optional(),
    charitable: z.string().trim().optional(),
  })
  .refine(
    (d) => {
      const total = d.beneficiaries.reduce((s, b) => s + (b.percent || 0), 0);
      return Math.round(total) === 100;
    },
    { message: "Beneficiary shares must add up to 100%.", path: ["beneficiaries"] },
  );

export const specialStepSchema = z.object({
  minorTrustAge: z.coerce.number().int().min(18).max(35).optional(),
  petCare: z.boolean().default(false),
  petCareDetail: z.string().trim().optional(),
  digitalAssets: z.boolean().default(false),
  noContest: z.boolean().default(false),
});

export const ancillaryStepSchema = z.object({
  financialPoaAgent: z.string().trim().optional(),
  healthcareAgent: z.string().trim().optional(),
  hipaaAuthorize: z.boolean().default(false),
});

export const reviewStepSchema = z.object({});

export const STEP_SCHEMAS: Record<StepKey, z.ZodType> = {
  state: stateStepSchema,
  doctype: doctypeStepSchema,
  about: aboutStepSchema,
  family: familyStepSchema,
  fiduciaries: fiduciariesStepSchema,
  assets: assetsStepSchema,
  distributions: distributionsStepSchema,
  special: specialStepSchema,
  ancillary: ancillaryStepSchema,
  review: reviewStepSchema,
};

export type ValidateResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

/** Validate a step's answers; returns the first error message on failure. */
export function validateStep(key: StepKey, data: unknown): ValidateResult {
  const parsed = STEP_SCHEMAS[key].safeParse(data);
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    error: parsed.error.issues[0]?.message ?? "Please check your answers.",
  };
}
