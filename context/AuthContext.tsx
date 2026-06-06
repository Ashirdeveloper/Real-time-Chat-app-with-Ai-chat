import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsLoading(false);
            
            // Set user as online
            if (session?.user?.id) {
                setUserOnline(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setIsLoading(false);
            
            // Update presence on auth change
            if (session?.user?.id) {
                setUserOnline(session.user.id);
            } else {
                // User logged out
                if (session?.user?.id) {
                    setUserOffline(session.user.id);
                }
            }
        });

        // Handle app state changes for presence
        const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.unsubscribe();
            appStateSubscription.remove();
        };
    }, []);

    const setUserOnline = async (userId: string) => {
        const now = new Date().toISOString();
        await supabase
            .from('user_status')
            .upsert(
                { user_id: userId, is_online: true, last_seen: now },
                { onConflict: 'user_id' }
            );
    };

    const setUserOffline = async (userId: string) => {
        await supabase
            .from('user_status')
            .update({ is_online: false, last_seen: new Date().toISOString() })
            .eq('user_id', userId);
    };

    const handleAppStateChange = async (state: AppStateStatus) => {
        if (session?.user?.id) {
            if (state === 'active') {
                await setUserOnline(session.user.id);
            } else if (state === 'background' || state === 'inactive') {
                await setUserOffline(session.user.id);
            }
        }
    };

    return (
        <AuthContext.Provider value={{ session, user: session?.user ?? null, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}
