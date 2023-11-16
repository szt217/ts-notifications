import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, useColorScheme } from 'react-native';

import Colors from '../../constants/Colors';
import { useAppSelector } from '../../redux/hooks';
import { selectNewNotificationCount } from '../../redux/slices/notifications';
import { useGetNotificationMetaQuery } from '../../redux/api';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const newCount = useAppSelector((state) => selectNewNotificationCount(state));

  useGetNotificationMetaQuery({});
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome size={26} name="home" color={color} />
        }}
      />

      <Tabs.Screen
        name="notification-screen"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <FontAwesome size={22} name="bell" color={color} />,
          tabBarBadge: newCount ? newCount : undefined
        }}
      />
    </Tabs>
  );
}
