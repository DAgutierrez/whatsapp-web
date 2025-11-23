import { create } from "zustand";
import { adminTutorialSteps } from "./AdminTutorialSteps";

interface TutorialStore {
  currentStepIndex: number;
  isActive: boolean;
  startTutorial: () => void;
  nextStep: () => void;
  finishTutorial: () => void;
  currentStep: typeof adminTutorialSteps[number] | null;
}

export const useAdminTutorial = create<TutorialStore>((set, get) => ({
  currentStepIndex: 0,
  isActive: false,

  startTutorial: () => {
    set({ currentStepIndex: 0, isActive: true });
  },

  nextStep: () => {
    const { currentStepIndex } = get();

    if (currentStepIndex + 1 < adminTutorialSteps.length) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else {
      set({ isActive: false });
    }
  },

  finishTutorial: () => set({ isActive: false }),

  get currentStep() {
    const { currentStepIndex, isActive } = get();
    if (!isActive) return null;
    return adminTutorialSteps[currentStepIndex];
  },
}));
