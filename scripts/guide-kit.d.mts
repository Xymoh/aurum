// Types for guide-kit.mjs, so the tests can import it under the app's strict settings.
import type { GuideFile, KitGroup } from "../src/lib/buildTarget/guide";

export function kitHash(kit: KitGroup[]): string;
export function today(): string;
export function withKitTracking<T extends { kit: KitGroup[] }>(
  guide: T,
  previousFile: string,
  date?: string,
): T & { kitChangedAt: string | null; kitHash: string };
export function guideBehindKit(guide: Pick<GuideFile, "kitChangedAt" | "source">): boolean;
