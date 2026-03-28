import { useEffect, useState } from 'react';
import { Joyride, EventData, STATUS, Step } from 'react-joyride';
import { useAuthStore } from '@/store/authStore';

export default function OnboardingTour() {
  const { user } = useAuthStore();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the onboarding tour
    const hasSeenTour = localStorage.getItem(`rex_onboarding_${user?.id}`);
    
    // Slight delay to let the app fully render before starting the tour
    if (!hasSeenTour && user) {
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const steps: Step[] = [
    {
      target: '.onboarding-logo',
      content: 'Welcome to REX! This is your central hub for managing projects with glassmorphic style and speed.',
      skipBeacon: true,
      placement: 'right',
    },
    {
      target: '.onboarding-dashboard',
      content: 'Here is your Dashboard. At a glance, you can see all your assigned tasks, recent activities, and project statuses.',
      placement: 'right',
    },
    {
      target: '.onboarding-project-selector',
      content: 'Quickly switch between projects here. All your boards, backlogs, and sprints are tied to the selected project.',
      placement: 'right',
    },
    {
      target: '.onboarding-project-links',
      content: 'Once a project is selected, these links will let you dive deep into its Kanban board, sprints, reports, and settings.',
      placement: 'right',
    },
    {
      target: '.onboarding-notifications',
      content: 'Stay updated! Your notifications for mentions, assignments, and updates will appear right here.',
      placement: 'left',
    },
    {
      target: '.onboarding-profile',
      content: 'Manage your profile, change the language, or log out using this menu. Enjoy your journey with REX!',
      placement: 'top',
    },
  ];

  const handleJoyrideEvent = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    // If the tour is finished or skipped, mark it in localStorage so it doesn't show again.
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem(`rex_onboarding_${user?.id}`, 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      scrollToFirstStep={true}
      onEvent={handleJoyrideEvent}
      options={{
        arrowColor: '#0f172a',
        backgroundColor: '#0f172a',
        overlayColor: 'rgba(2, 6, 23, 0.75)',
        primaryColor: '#06b6d4',
        textColor: '#f8fafc',
        zIndex: 1000,
        showProgress: true,
        buttons: ['back', 'skip', 'primary'], // added skip to buttons array
      }}
      styles={{
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltip: {
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          padding: '24px',
        },
        tooltipContent: {
          padding: '20px 0',
          fontSize: '15px',
          lineHeight: '1.6',
          color: '#cbd5e1', /* slate-300 */
        },
        tooltipTitle: {
          color: '#06b6d4',
          margin: 0,
          fontSize: '18px',
          fontWeight: 700,
        },
        buttonPrimary: {
          backgroundColor: '#0891b2', /* cyan-600 */
          borderRadius: '8px',
          color: '#fff',
          fontWeight: 600,
          padding: '10px 16px',
        },
        buttonBack: {
          color: '#94a3b8', /* slate-400 */
          marginRight: '12px',
          fontWeight: 600,
        },
        buttonSkip: {
          color: '#e2e8f0', /* slate-200 */
          fontWeight: 600,
        },
        buttonClose: {
          display: 'none',
        }
      }}
    />
  );
}
