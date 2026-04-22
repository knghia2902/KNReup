import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
}

interface AuthState {
  user: UserProfile | null;
  isLoggedIn: boolean;
  /** Premium features that require login */
  premiumFeatures: string[];

  login: (user: UserProfile) => void;
  logout: () => void;
  /** Check if a specific feature requires auth */
  isFeatureLocked: (featureId: string) => boolean;
}

const PREMIUM_FEATURES = [
  'ai-refine',
  'voice-clone',
  'translate-gemini',
  'translate-openai',
  'translate-deepseek',
  'export-h265',
  'batch-export',
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      premiumFeatures: PREMIUM_FEATURES,

      login: (user) => set({ user, isLoggedIn: true }),

      logout: () => set({ user: null, isLoggedIn: false }),

      isFeatureLocked: (featureId) => {
        const { isLoggedIn, premiumFeatures } = get();
        return !isLoggedIn && premiumFeatures.includes(featureId);
      },
    }),
    { name: 'knreup-auth' }
  )
);
