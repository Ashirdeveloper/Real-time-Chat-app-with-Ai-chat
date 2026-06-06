import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface Conversation {
    id: string;
    full_name: string;
    avatar_url: string | null;
    lastMessage: string;
    lastTime: string;
    isOnline: boolean;
}

export default function ChatsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    // Search Modal State
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchEmail, setSearchEmail] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchConversations();

        // Subscribe to new messages to auto-refresh the conversation list
        const messageChannel = supabase
            .channel(`chats_list:${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            }, (payload) => {
                const msg = payload.new as any;
                if (msg.sender_id === user.id || msg.recipient_id === user.id) {
                    fetchConversations();
                }
            })
            .subscribe();

        // Subscribe to user status changes
        const statusChannel = supabase
            .channel('user_status_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'user_status',
            }, () => {
                // Refresh conversations to update online status
                fetchConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(messageChannel);
            supabase.removeChannel(statusChannel);
        };
    }, [user]);

    const fetchConversations = async () => {
        if (!user) return;

        try {
            // Get most recent message per unique conversation partner
            const { data: messages, error } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Build a map of partner_id → most recent message
            const conversationMap = new Map<string, any>();
            for (const msg of messages || []) {
                const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
                if (!conversationMap.has(partnerId)) {
                    conversationMap.set(partnerId, msg);
                }
            }

            if (conversationMap.size === 0) {
                setConversations([]);
                setLoading(false);
                return;
            }

            // Fetch profiles for all unique partners
            const partnerIds = Array.from(conversationMap.keys());
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', partnerIds);

            if (profileError) throw profileError;

            // Fetch user status for all partners
            const { data: statusData } = await supabase
                .from('user_status')
                .select('user_id, is_online')
                .in('user_id', partnerIds);

            const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
            const statusMap = new Map((statusData || []).map((s: any) => [s.user_id, s.is_online]));

            const convList: Conversation[] = partnerIds
                .map((partnerId) => {
                    const msg = conversationMap.get(partnerId);
                    const profile = profileMap.get(partnerId);
                    if (!profile) return null;

                    const msgDate = new Date(msg.created_at);
                    const now = new Date();
                    const isToday = msgDate.toDateString() === now.toDateString();

                    return {
                        id: partnerId,
                        full_name: profile.full_name || 'Unknown User',
                        avatar_url: profile.avatar_url,
                        lastMessage: msg.sender_id === user.id ? `You: ${msg.content}` : msg.content,
                        lastTime: isToday
                            ? msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' }),
                        isOnline: statusMap.get(partnerId) ?? false,
                    };
                })
                .filter(Boolean) as Conversation[];

            setConversations(convList);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchEmail.trim()) return;
        setIsSearching(true);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', searchEmail.toLowerCase().trim())
                .single();

            if (error || !data) {
                Alert.alert('User not found', 'No user found with this email.');
            } else if (data.id === user?.id) {
                Alert.alert('Error', 'You cannot chat with yourself.');
            } else {
                setIsSearchVisible(false);
                setSearchEmail('');
                router.push({ pathname: '/chat/[id]', params: { id: data.id } });
            }
        } catch {
            Alert.alert('Error', 'An error occurred while searching.');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4">
                <Text className="text-2xl font-bold text-purple-600">Chats</Text>
                <TouchableOpacity onPress={() => setIsSearchVisible(true)}>
                    <Ionicons name="create-outline" size={24} color="#374151" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* AI Assistant — always pinned at top */}
                <View className="px-6 mb-2">
                    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">AI</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/ai_chat')}
                        className="flex-row items-center bg-white mb-4"
                    >
                        <View className="w-14 h-14 rounded-full bg-violet-500 items-center justify-center mr-4">
                            <Ionicons name="sparkles" size={24} color="white" />
                        </View>
                        <View className="flex-1 border-b border-gray-100 pb-4">
                            <View className="flex-row justify-between mb-1">
                                <Text className="font-bold text-lg text-gray-900">AI Assistant</Text>
                                <Text className="text-gray-400 text-xs">Gemini</Text>
                            </View>
                            <Text className="text-gray-500" numberOfLines={1}>Tap to chat with Google Gemini AI</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Recent Conversations */}
                <View className="px-6 pb-24">
                    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Messages</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#7C3AED" className="mt-10" />
                    ) : conversations.length === 0 ? (
                        <View className="items-center mt-16">
                            <Ionicons name="chatbubbles-outline" size={60} color="#E5E7EB" />
                            <Text className="text-gray-400 mt-4 text-center">No conversations yet.{'\n'}Tap the pencil icon to start chatting!</Text>
                        </View>
                    ) : (
                        conversations.map((conv) => (
                            <TouchableOpacity
                                key={conv.id}
                                onPress={() => router.push({ pathname: '/chat/[id]', params: { id: conv.id } })}
                                className="flex-row items-center bg-white mb-5"
                            >
                                <View className="relative mr-4">
                                    <Image
                                        source={{ uri: conv.avatar_url || `https://i.pravatar.cc/150?u=${conv.id}` }}
                                        className="w-14 h-14 rounded-full bg-gray-200"
                                    />
                                    {/* Online Status Indicator */}
                                    <View className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${conv.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                                </View>
                                <View className="flex-1 border-b border-gray-50 pb-4">
                                    <View className="flex-row justify-between mb-1 items-center">
                                        <View className="flex-row items-center flex-1">
                                            <Text className="font-bold text-lg text-gray-900">{conv.full_name}</Text>
                                            <Text className={`text-xs ml-2 ${conv.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                                                {conv.isOnline ? '● Online' : '● Offline'}
                                            </Text>
                                        </View>
                                        <Text className="text-gray-400 text-xs">{conv.lastTime}</Text>
                                    </View>
                                    <Text className="text-gray-500" numberOfLines={1}>{conv.lastMessage}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* New Chat FAB */}
            <TouchableOpacity
                onPress={() => setIsSearchVisible(true)}
                className="absolute bottom-6 right-6 w-14 h-14 bg-purple-600 rounded-full items-center justify-center shadow-lg shadow-purple-300"
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

            {/* Search / New Chat Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isSearchVisible}
                onRequestClose={() => setIsSearchVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6 min-h-[50%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-gray-900">New Chat</Text>
                            <TouchableOpacity onPress={() => setIsSearchVisible(false)}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-gray-500 mb-2">Search by Email</Text>
                        <TextInput
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-700 mb-4"
                            placeholder="friend@example.com"
                            placeholderTextColor="#9CA3AF"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={searchEmail}
                            onChangeText={setSearchEmail}
                        />

                        <TouchableOpacity
                            onPress={handleSearch}
                            disabled={isSearching}
                            className="bg-purple-600 rounded-xl py-4 items-center mb-4"
                        >
                            {isSearching ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Start Chat</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
