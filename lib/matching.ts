/**
 * Calculate how well a candidate's skills match a job's required skills.
 *
 * Formula: (User Skills ∩ Job Required Skills) / Total Job Required Skills
 *
 * Comparison is case-insensitive. Returns 0 if jobSkills is empty.
 *
 * @param userSkills     - Skills from the user's profile (e.g. ["React", "TypeScript"])
 * @param jobSkills      - Skills required by the job (e.g. ["react", "node.js", "typescript"])
 * @returns              Integer match percentage 0–100
 *
 * @example
 * calculateMatchScore(["React", "TypeScript", "Node.js"], ["react", "typescript", "python"])
 * // => 67  (2 of 3 job skills matched)
 */
export function calculateMatchScore(
  userSkills: string[],
  jobSkills: string[],
): number {
  if (jobSkills.length === 0) return 0;

  const userSet = new Set(userSkills.map((s) => s.toLowerCase()));
  const matched = jobSkills.filter((s) => userSet.has(s.toLowerCase())).length;

  return Math.round((matched / jobSkills.length) * 100);
}
