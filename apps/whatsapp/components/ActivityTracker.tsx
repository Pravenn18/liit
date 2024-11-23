// components/ActivityTracker.tsx
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { userOnlineStatusAtom, userLastSeenAtom } from '@/data/atom/userState';
import { updateUserLastSeen } from '@/services/userService';
import {
  AppState,
  AppStateStatus,
  TouchableWithoutFeedback,
} from 'react-native';

interface ActivityContextType {
  resetInactivityTimer: () => void;
}

const ActivityContext = createContext<ActivityContextType | null>(null);

import { ReactNode } from 'react';

export const ActivityProvider = ({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) => {
  const [, setIsOnline] = useAtom(userOnlineStatusAtom);
  const [, setLastSeen] = useAtom(userLastSeenAtom);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(async () => {
      await updateUserLastSeen(userId);
      setLastSeen(new Date());
      setIsOnline(false);
    }, 30000); // 30 seconds
  };

  useEffect(() => {
    const handleActivity = () => {
      setIsOnline(true);
      resetInactivityTimer();
    };

    // Handle app state changes
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        handleActivity();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
        }
        setIsOnline(false);
        console.log('userId', JSON.stringify(userId));
        await updateUserLastSeen(userId);
      }
    };

    // Subscribe to app state changes
    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    // Initial setup
    resetInactivityTimer();

    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      // Clean up app state subscription
      appStateSubscription.remove();
    };
  }, [userId]);

  // Wrap children in TouchableWithoutFeedback to detect user interaction
  return (
    <ActivityContext.Provider value={{ resetInactivityTimer }}>
      <TouchableWithoutFeedback
        onPress={() => {
          setIsOnline(true);
          resetInactivityTimer();
        }}
      >
        {children}
      </TouchableWithoutFeedback>
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};
