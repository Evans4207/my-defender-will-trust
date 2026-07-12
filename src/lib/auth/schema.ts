import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email();

// Supabase enforces a 6-char minimum by default; we require 8 for safety.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.");

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Please enter your name."),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Please enter your password."),
});

export const magicLinkSchema = z.object({ email: emailSchema });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({ password: passwordSchema });
