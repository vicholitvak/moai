'use client';

import OnboardingGuide, { useOnboardingCheck } from './OnboardingGuide';

export default function OnboardingHandler() {
  const { shouldShowOnboarding, closeOnboarding, userRole } = useOnboardingCheck();

  return (
    <OnboardingGuide
      isOpen={shouldShowOnboarding}
      onClose={closeOnboarding}
      userRole={userRole}
    />
  );
}