/**
 * The grade ladder every scorer uses, on the 0 to 200 scale where 200 is the
 * optimal piece for the slot. It is Fribbels' relic ladder (one band per 5%
 * of perfection) doubled, so S sits at 100, SS at 120, SSS at 140. Keeping
 * it in one place means a grade reads the same on every game tab.
 */
export const GRADE_LADDER: ReadonlyArray<{ min: number; grade: string }> = [
  { min: 170, grade: "WTF+" },
  { min: 160, grade: "WTF" },
  { min: 150, grade: "SSS+" },
  { min: 140, grade: "SSS" },
  { min: 130, grade: "SS+" },
  { min: 120, grade: "SS" },
  { min: 110, grade: "S+" },
  { min: 100, grade: "S" },
  { min: 90, grade: "A+" },
  { min: 80, grade: "A" },
  { min: 70, grade: "B+" },
  { min: 60, grade: "B" },
  { min: 50, grade: "C+" },
  { min: 40, grade: "C" },
  { min: 30, grade: "D+" },
  { min: 20, grade: "D" },
  { min: 10, grade: "F+" },
  { min: 0, grade: "F" },
];

export function gradeFor(percent: number): string {
  for (const band of GRADE_LADDER) if (percent >= band.min) return band.grade;
  return "F";
}
