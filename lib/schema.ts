import { z } from "zod";

// ── Location ────────────────────────────────────────────────────────────────

export const LocationSchema = z.object({
  city: z.string(),
  state: z.string(),
  country: z.string(),
});
export type Location = z.infer<typeof LocationSchema>;

// ── User ────────────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  image: z.string().url().optional(),
  skills: z.array(z.string()),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
  preferred_salary: z.number().positive().optional(),
});
export type User = z.infer<typeof UserSchema>;

// ── Job ─────────────────────────────────────────────────────────────────────

export const JobSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  company: z.string(),
  description: z.string(),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  salary_min: z.number().positive().optional(),
  salary_max: z.number().positive().optional(),
  required_skills: z.array(z.string()),
});
export type Job = z.infer<typeof JobSchema>;

// ── Application ─────────────────────────────────────────────────────────────

export const ApplicationStatusSchema = z.enum([
  "pending",
  "viewed",
  "shortlisted",
  "interview",
  "offer",
  "declined",
  // legacy values kept for backward compatibility
  "reviewed",
  "rejected",
]);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  job_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: ApplicationStatusSchema.default("pending"),
  match_percentage: z.number().int().min(0).max(100),
  submitted_data: z.record(z.unknown()), // jsonb snapshot
  resume_url: z.string().url().optional(),
});
export type Application = z.infer<typeof ApplicationSchema>;

// ── LLM extraction schemas (used with generateObject) ───────────────────────

export const SkillExtractionSchema = z.object({
  skills: z
    .array(z.string())
    .describe("Normalized skill names, e.g. ['React', 'TypeScript', 'Node.js']"),
});
export type SkillExtraction = z.infer<typeof SkillExtractionSchema>;

export const LocationExtractionSchema = z.object({
  city: z.string().describe("City name, empty string if unknown"),
  state: z.string().describe("State or province, empty string if unknown"),
  country: z.string().describe("Country name, empty string if unknown"),
});
export type LocationExtraction = z.infer<typeof LocationExtractionSchema>;

export const EducationItemSchema = z.object({
  school: z.string().describe("Institution name"),
  degree: z.string().describe("Degree type, e.g. Bachelor's, Master's"),
  field: z.string().describe("Field of study"),
  start_year: z.string().describe("Start year, e.g. '2015', empty if unknown"),
  end_year: z.string().describe("End year or 'Present', empty if unknown"),
});
export type EducationItem = z.infer<typeof EducationItemSchema>;

export const ExperienceItemSchema = z.object({
  company: z.string().describe("Company or organisation name"),
  title: z.string().describe("Job title"),
  start_date: z.string().describe("Start date, e.g. 'Jan 2020', empty if unknown"),
  end_date: z.string().describe("End date or 'Present', empty if unknown"),
  description: z.string().describe("Short summary of responsibilities"),
});
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;

export const PortfolioItemSchema = z.object({
  title: z.string().describe("Project or portfolio item title"),
  url: z.string().describe("URL, empty if not provided"),
  description: z.string().describe("Short description of the project"),
});
export type PortfolioItem = z.infer<typeof PortfolioItemSchema>;

export const ProfileExtractionSchema = z.object({
  name: z.string().describe("Full name of the person, empty string if not mentioned"),
  skills: z.array(z.string()).describe("Normalized skill names, e.g. ['React', 'TypeScript']"),
  city: z.string().describe("City name, empty string if unknown"),
  state: z.string().describe("State or province, empty string if unknown"),
  country: z.string().describe("Country name, empty string if unknown"),
  preferred_salary: z.number().nullable().describe("Annual salary as a number, null if not mentioned"),
  preferred_currency: z.string().describe(
    "ISO 4217 currency code inferred from location or explicit mention (e.g. USD, SGD, MYR, GBP, AUD). Default USD.",
  ),
  languages: z.array(z.string()).describe("Human languages the person speaks, e.g. ['English', 'Mandarin']. Empty array if none mentioned."),
  education: z.array(EducationItemSchema).describe("Education history, empty array if none mentioned"),
  experience: z.array(ExperienceItemSchema).describe("Work experience history, empty array if none mentioned"),
  portfolio: z.array(PortfolioItemSchema).describe("Portfolio / projects, empty array if none mentioned"),
});
export type ProfileExtraction = z.infer<typeof ProfileExtractionSchema>;
