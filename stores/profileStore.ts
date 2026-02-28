import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { ClassScenarioChallenge } from '@/lib/class-cards';

interface ClassScenario {
  challenges: ClassScenarioChallenge[];
}

interface ProfileStore {
  teacherProfile: any | null; // Replace 'any' with a stricter type if available later
  classScenario: ClassScenario | null;
  hasHydrated: boolean;
  
  setTeacherProfile: (profile: any) => void;
  setClassScenario: (scenario: ClassScenario) => void;
  clearProfile: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useProfileStore = create<ProfileStore>()(
  devtools(
    persist(
      (set) => ({
        teacherProfile: null,
        classScenario: null,
        hasHydrated: false,
        
        setTeacherProfile: (profile) => set({ teacherProfile: profile }),
        setClassScenario: (scenario) => set({ classScenario: scenario }),
        clearProfile: () => set({ teacherProfile: null, classScenario: null }),
        setHasHydrated: (state) => set({ hasHydrated: state }),
      }),
      {
        name: 'teacher-profile-storage', // key in localStorage
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true)
        }
      }
    )
  )
)
