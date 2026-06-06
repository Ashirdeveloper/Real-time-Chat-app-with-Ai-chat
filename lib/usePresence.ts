import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from './supabase';

export const usePresence = (userId: string | undefined) => {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        if (!userId) return;

        // Set user as online when component mounts
        const setUserOnline = async () => {
            const now = new Date().toISOString();
            await supabase
                .from('user_status')
                .upsert(
                    { user_id: userId, is_online: true, last_seen: now },
                    { onConflict: 'user_id' }
                );
        };

        // Set user as offline when component unmounts
        const setUserOffline = async () => {
            await supabase
                .from('user_status')
                .update({ is_online: false, last_seen: new Date().toISOString() })
                .eq('user_id', userId);
        };

        // Handle app state changes
        const subscription = AppState.addEventListener('change', async (state: AppStateStatus) => {
            if (state === 'active') {
                setIsOnline(true);
                await setUserOnline();
            } else if (state === 'background' || state === 'inactive') {
                setIsOnline(false);
                await setUserOffline();
            }
        });

        setUserOnline();

        return () => {
            subscription.remove();
            setUserOffline();
        };
    }, [userId]);

    return isOnline;
};

export const useUserStatus = (userId: string | undefined) => {
    const [userStatus, setUserStatus] = useState<{
        is_online: boolean;
        last_seen: string;
    } | null>(null);

    useEffect(() => {
        if (!userId) return;

        // Fetch initial status
        const fetchStatus = async () => {
            const { data } = await supabase
                .from('user_status')
                .select('is_online, last_seen')
                .eq('user_id', userId)
                .single();

            if (data) {
                setUserStatus(data);
            }
        };

        fetchStatus();

        // Subscribe to real-time updates
        const subscription = supabase
            .channel(`user_status:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_status',
                    filter: `user_id=eq.${userId}`,
                },
                (payload: { new: any; }) => {
                    setUserStatus(payload.new as any);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [userId]);

    return userStatus;
};
