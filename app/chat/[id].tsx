import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

/**
 * Generates a stable channel name for a conversation between two users.
 * Sorts the UUIDs so both participants always join the same channel.
 */
function getChannelName(userA: string, userB: string) {
    return `chat:${[userA, userB].sort().join('_')}`;
}

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [recipient, setRecipient] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const otherId = Array.isArray(id) ? id[0] : id;

    useEffect(() => {
        if (!currentUser || !otherId) return;

        fetchRecipient();
        fetchMessages();

        // Stable sorted channel so both participants subscribe to the same channel
        const channelName = getChannelName(currentUser.id, otherId);

        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            }, (payload: any) => {
                const msg = payload.new as any;
                const isRelevant =
                    (msg.sender_id === otherId && msg.recipient_id === currentUser.id) ||
                    (msg.sender_id === currentUser.id && msg.recipient_id === otherId);

                if (isRelevant) {
                    setMessages((prev) => {
                        // Deduplicate: avoid showing both optimistic and real message
                        const alreadyExists = prev.some(
                            (m) =>
                                m.id === msg.id ||
                                (typeof m.id === 'number' &&
                                    m.id > 1e12 &&
                                    m.content === msg.content &&
                                    m.sender_id === msg.sender_id)
                        );
                        if (alreadyExists) return prev;
                        return [...prev, msg];
                    });
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [otherId, currentUser]);

    const fetchRecipient = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', otherId).single();
        setRecipient(data);
    };

    const fetchMessages = async () => {
        if (!currentUser || !otherId) return;

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(
                `and(sender_id.eq.${currentUser.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${currentUser.id})`
            )
            .order('created_at', { ascending: true });

        if (error) console.error('fetchMessages error:', error);
        else setMessages(data || []);
        setLoading(false);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !currentUser || !otherId || isSending) return;

        const messageContent = newMessage.trim();
        setNewMessage('');
        setIsSending(true);

        // Optimistic UI update
        const tempId = Date.now();
        setMessages((prev) => [
            ...prev,
            {
                id: tempId,
                content: messageContent,
                sender_id: currentUser.id,
                recipient_id: otherId,
                created_at: new Date().toISOString(),
            },
        ]);

        const { error } = await supabase.from('messages').insert({
            content: messageContent,
            sender_id: currentUser.id,
            recipient_id: otherId,
        });

        if (error) {
            console.error('Error sending message:', error);
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
        }

        setIsSending(false);
    };

    return (
        // SafeAreaView handles top + bottom safe area (status bar & gesture bar)
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
            {/*
             * KeyboardAvoidingView wraps the entire content below the header.
             * This is the WhatsApp pattern — the whole body shifts up when the
             * keyboard appears, so the input stays visible above the keypad.
             */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                // On iOS, offset = 0 because SafeAreaView already handles it.
                // On Android, 0 also works with behavior='height'.
                keyboardVerticalOffset={0}
            >
                {/* ── Header ── */}
                <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="flex-row items-center mr-2"
                        >
                            <Ionicons name="chevron-back" size={28} color="#007AFF" />
                            <View className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
                                <Image
                                    source={{ uri: recipient?.avatar_url || 'https://i.pravatar.cc/150' }}
                                    className="w-full h-full"
                                />
                            </View>
                        </TouchableOpacity>
                        <View className="flex-1 ml-2">
                            <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>
                                {recipient?.full_name || 'User'}
                            </Text>
                            <Text className="text-xs text-green-500">Online</Text>
                        </View>
                    </View>
                    <View className="flex-row items-center">
                        <TouchableOpacity className="mr-6">
                            <Ionicons name="videocam-outline" size={26} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity>
                            <Ionicons name="call-outline" size={24} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Messages ── */}
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1 bg-[#efeae2] px-4 pt-4"
                    contentContainerStyle={{ paddingBottom: 12 }}
                    onContentSizeChange={() =>
                        scrollViewRef.current?.scrollToEnd({ animated: true })
                    }
                    keyboardShouldPersistTaps="handled"
                >
                    {loading ? (
                        <ActivityIndicator size="large" color="#007AFF" className="mt-10" />
                    ) : messages.length === 0 ? (
                        <View className="flex-1 items-center justify-center mt-20">
                            <Ionicons name="chatbubbles-outline" size={52} color="#D1D5DB" />
                            <Text className="text-gray-400 mt-3">No messages yet. Say hi! 👋</Text>
                        </View>
                    ) : (
                        messages.map((msg, index) => (
                            <View
                                key={`${msg.id}-${index}`}
                                className={`mb-4 flex-row ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.sender_id !== currentUser?.id && (
                                    <Image
                                        source={{ uri: recipient?.avatar_url || 'https://i.pravatar.cc/150' }}
                                        className="w-8 h-8 rounded-full mr-2 self-end mb-1"
                                    />
                                )}
                                <View
                                    className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm ${msg.sender_id === currentUser?.id
                                        ? 'bg-[#DCF8C6] rounded-tr-none'
                                        : 'bg-white rounded-tl-none'
                                        }`}
                                >
                                    <Text className="text-gray-800 text-[15px]">{msg.content}</Text>
                                    <View className="flex-row justify-end items-center mt-1">
                                        <Text className="text-[10px] text-gray-500 mr-1">
                                            {new Date(msg.created_at).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Text>
                                        {msg.sender_id === currentUser?.id && (
                                            <Ionicons name="checkmark-done" size={14} color="#34B7F1" />
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>

                {/* ── Input bar ── sits directly at the bottom of KeyboardAvoidingView */}
                <View className="px-3 py-2 bg-white border-t border-gray-100 flex-row items-end">
                    <TouchableOpacity className="mb-2 mr-2">
                        <Ionicons name="add" size={28} color="#007AFF" />
                    </TouchableOpacity>
                    <TextInput
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Message"
                        multiline
                        style={{
                            flex: 1,
                            backgroundColor: '#F3F4F6',
                            borderColor: '#E5E7EB',
                            borderWidth: 1,
                            borderRadius: 16,
                            paddingHorizontal: 16,
                            fontSize: 16,
                            marginBottom: 4,
                            marginRight: 8,
                            paddingTop: 10,
                            paddingBottom: 10,
                            minHeight: 40,
                            maxHeight: 120
                        }}
                        onSubmitEditing={sendMessage}
                        blurOnSubmit={false}
                    />
                    {newMessage.trim().length > 0 ? (
                        <TouchableOpacity
                            onPress={sendMessage}
                            disabled={isSending}
                            style={{
                                width: 40,
                                height: 40,
                                backgroundColor: '#007AFF',
                                borderRadius: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 4,
                                flexShrink: 0
                            }}
                        >
                            {isSending ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Ionicons name="send" size={18} color="white" />
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={{ marginBottom: 8, marginLeft: 4 }}>
                            <Ionicons name="mic-outline" size={26} color="#007AFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
