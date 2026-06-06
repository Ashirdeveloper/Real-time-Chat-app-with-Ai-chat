import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 0,
                    height: 90,
                    paddingBottom: 30,
                    paddingTop: 10,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 10,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                },
                tabBarActiveTintColor: '#7C3AED',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    marginBottom: 5,
                },
            }}
        >
            <Tabs.Screen
                name="chats"
                options={{
                    title: 'Chats',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="chatbubble-ellipses" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="ai_chat"
                options={{
                    title: 'AI Chat',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="sparkles" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="settings" color={color} focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}

// Animated Tab Icon Component
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

function TabIcon({ name, color, focused }: { name: any; color: string; focused: boolean }) {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (focused) {
            Animated.spring(scale, {
                toValue: 1.2,
                useNativeDriver: true,
                friction: 4,
            }).start();
        } else {
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        }
    }, [focused]);

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name={focused ? name : `${name}-outline` as any} size={28} color={color} />
        </Animated.View>
    );
}
