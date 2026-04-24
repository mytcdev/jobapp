# JobApp Project - CLAUDE.md (V4)

## Project Vision
A zero-cost, intelligent job portal with Social Login, LLM data extraction, 
and automated candidate-to-job skill matching.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Auth:** NextAuth.js (Adapter: Supabase)
- **Database:** Supabase (PostgreSQL)
- **AI SDK:** Vercel AI SDK (Gemini 1.5 Flash + Groq Fallback)
- **PDF Gen:** jsPDF (Client-side)
- **Styling:** Tailwind CSS + shadcn/ui

## Database Schema (Supabase)
- **users**: 
  - id, name, email, image
  - skills (text[]) // Array of extracted skills
  - city, state, country (text)
  - bio (text)
  - preferred_salary (numeric, optional)
- **jobs**: 
  - id, title, company, description
  - country, state, city (text)
  - salary_min, salary_max (numeric, optional)
  - required_skills (text[]) // Array of keywords
- **applications**: 
  - id, job_id, user_id, status
  - match_percentage (int) // Calculated on submission
  - submitted_data (jsonb) // Snapshot of user profile at time of applying
  - resume_url

## Architecture Rules
- **Skill Extraction:** The LLM must normalize user input into a clean string array (e.g., ["React", "TypeScript", "Node.js"]).
- **Matching Logic:** - Match % = (User Skills ∩ Job Required Skills) / (Total Job Required Skills).
  - Calculated in the API route before saving the application.
- **Location Normalization:** LLM splits user location into city, state, country.
- **Admin Access:** Role-based protection for `/admin` via NextAuth callbacks.

## Coding Standards
- Use `zod` for strict schema validation.
- Implement a `calculateMatchScore(userSkills, jobSkills)` utility function.
- UI: Use `Badge` components for skills and `Progress` bars for match percentages.

## Common Commands
- **Dev:** `npm run dev`
- **DB Migration:** `npx supabase db push`
