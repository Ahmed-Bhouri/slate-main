import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface ProfileStore {
  teacherProfile: any | null; // Replace 'any' with a stricter type if available later
  classScenario: any | null; // Replace 'any' with a stricter type if available later
  
  setTeacherProfile: (profile: any) => void;
  setClassScenario: (scenario: any) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileStore>()(
  devtools(
    persist(
      (set) => ({
        teacherProfile: null,
        classScenario: null,
        
        setTeacherProfile: (profile) => set({ teacherProfile: profile }),
        setClassScenario: (scenario) => set({ classScenario: scenario }),
        clearProfile: () => set({ teacherProfile: null, classScenario: null }),
      }),
      {
        name: 'teacher-profile-storage', // key in localStorage
      }
    )
  )
)
