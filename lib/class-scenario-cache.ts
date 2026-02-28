/**
 * localStorage cache for class-scenario API response.
 * Avoids refetching when navigating between Home and Trainings.
 */

import type { ClassScenarioChallenge } from "./class-cards";

const CLASS_SCENARIO_CACHE_KEY = "slate-class-scenario";

type ClassScenarioCache = {
  profileSnapshot: string;
  challenges: ClassScenarioChallenge[];
};

function getCache(): ClassScenarioCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CLASS_SCENARIO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const { profileSnapshot, challenges } = parsed as ClassScenarioCache;
    if (typeof profileSnapshot !== "string" || !Array.isArray(challenges)) return null;
    return { profileSnapshot, challenges };
  } catch {
    return null;
  }
}

/**
 * Returns cached challenges if they exist and match the current profile.
 * Otherwise returns null (caller should fetch).
 */
export function getCachedClassScenario(profile: object): ClassScenarioChallenge[] | null {
  const snapshot = JSON.stringify(profile);
  const cached = getCache();
  if (!cached || cached.profileSnapshot !== snapshot) return null;
  return cached.challenges;
}

/**
 * Saves the class-scenario response to localStorage for the given profile.
 */
export function setCachedClassScenario(
  profile: object,
  challenges: ClassScenarioChallenge[]
): void {
  if (typeof window === "undefined") return;
  try {
    const cache: ClassScenarioCache = {
      profileSnapshot: JSON.stringify(profile),
      challenges,
    };
    localStorage.setItem(CLASS_SCENARIO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage errors
  }
}
