import { useAtom } from 'jotai';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Image } from 'react-native';
import { phoneAtom } from '@/data/atom/userAtom';
import { userLastSeenAtom, userOnlineStatusAtom } from '@/data/atom/userState';
import {
  getUserByPhone,
  updateUserLastSeen,
  updateUserOnlineStatus,
} from '@/services/userService';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  const icons = {
    chats: require('@/assets/images/chats.png'),
    updates: require('@/assets/images/updates.png'),
    calls: require('@/assets/images/calls.png'),
  };

  const [phone] = useAtom(phoneAtom);
  const [, setLastSeen] = useAtom(userLastSeenAtom);
  const [, setIsOnline] = useAtom(userOnlineStatusAtom);

  // useEffect(() => {
  //   const handleAppStateChange = async (nextAppState: AppStateStatus) => {
  //     const user = await getUserByPhone(phone);
  //     const userId = user?.id;

  //     if (userId) {
  //       if (nextAppState === 'background' || nextAppState === 'inactive') {
  //         console.log('App is in background or inactive ONE');
  //         await updateUserLastSeen(userId);
  //         setLastSeen(new Date());
  //         console.log('App is in background or inactive TWO');
  //         await updateUserOnlineStatus(userId, false);
  //         setIsOnline(false);
  //         console.log('App is in background or inactive THREE');
  //       } else if (nextAppState === 'active') {
  //         console.log('App is in active');
  //         await updateUserOnlineStatus(userId, true);
  //         setIsOnline(true);
  //         console.log('App is in active TWO');
  //       }
  //     }
  //   };

  //   // Add AppState change listener
  //   const subscription = AppState.addEventListener(
  //     'change',
  //     handleAppStateChange,
  //   );

  //   return () => {
  //     // Remove AppState change listener
  //     subscription.remove();
  //   };
  // }, [phone]);

  // TODO: implement last seen and online status
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState) => {
        appState.current = nextAppState;
        setAppStateVisible(appState.current);
        console.log('AppState', appState.current);

        if (nextAppState === 'background') {
          const user = await getUserByPhone(phone);
          const userId = user?.id;

          if (userId) {
            await updateUserOnlineStatus(userId, false);
          }
        }

        const user = await getUserByPhone(phone);
        const userId = user?.id;

        if (userId) {
          if (nextAppState === 'active') {
            await updateUserOnlineStatus(userId, true);
            console.log('App has come to the foreground!');
            // } else if (appState.current.match(/inactive|background/)) {
            //   await Promise.all([updateUserOnlineStatus(userId, false)]);
            //   setIsOnline(false);
            //   console.log('App has gone to the background!');
          }
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [phone]);

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="(tabs)" options={{ headerShown: false }} />
    </Tabs>
  );
}
