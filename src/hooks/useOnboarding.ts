import { useState, useEffect } from 'react';

type Role = 'owner' | 'guest' | 'manager';

const ONBOARDING_KEY_PREFIX = 'pg_manager_onboarding_completed_';

export function useOnboarding(role: Role, userId?: string) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = `${ONBOARDING_KEY_PREFIX}${role}_${userId || 'anonymous'}`;

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      setShowOnboarding(true);
    }
    setIsLoading(false);
  }, [storageKey, userId]);

  const completeOnboarding = () => {
    localStorage.setItem(storageKey, 'true');
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(storageKey);
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
}
