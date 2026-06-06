import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GeminiMessage, sendToGemini } from '../../lib/gemini';

interface ChatMessage {
    id: number;
    role: 'user' | 'ai';
    text: string;
    time: string;
    isError?: boolean;
}

function getTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AIChatScreen() {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Displayed messages (for the UI)
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        {
            id: 1,
            role: 'ai',
            text: "Hello! I'm your AI assistant powered by Google Gemini. How can I help you today?",
            time: getTime(),
        },
    ]);

    // Gemini API conversation history (role: 'user' | 'model')
    const geminiHistory = useRef<GeminiMessage[]>([]);

    const handleSend = async () => {
        if (!message.trim() || isTyping) return;

        const userText = message.trim();
        setMessage('');

        // Add the user's message to UI
        const userMsg: ChatMessage = {
            id: Date.now(),
            role: 'user',
            text: userText,
            time: getTime(),
        };
        setChatHistory((prev) => [...prev, userMsg]);

        // Add to Gemini history
        geminiHistory.current = [
            ...geminiHistory.current,
            { role: 'user', parts: [{ text: userText }] },
        ];

        setIsTyping(true);

        try {
            const aiText = await sendToGemini(geminiHistory.current);

            // Add AI response to Gemini history
            geminiHistory.current = [
                ...geminiHistory.current,
                { role: 'model', parts: [{ text: aiText }] },
            ];

            const aiMsg: ChatMessage = {
                id: Date.now() + 1,
                role: 'ai',
                text: aiText,
                time: getTime(),
            };
            setChatHistory((prev) => [...prev, aiMsg]);
        } catch (error: any) {
            const errMsg: ChatMessage = {
                id: Date.now() + 1,
                role: 'ai',
                text: `⚠️ Sorry, I couldn't get a response. Please try again.\n\n${error?.message ?? ''}`,
                time: getTime(),
                isError: true,
            };
            setChatHistory((prev) => [...prev, errMsg]);
            // Remove the failed user message from Gemini history so it doesn't break context
            geminiHistory.current = geminiHistory.current.slice(0, -1);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm pt-2">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-violet-100 rounded-full items-center justify-center mr-3 shadow-sm">
                        <Ionicons name="sparkles" size={20} color="#7C3AED" />
                    </View>
                    <View>
                        <Text className="font-bold text-lg text-gray-900">Google Gemini</Text>
                        <View className="flex-row items-center">
                            {isTyping ? (
                                <Text className="text-xs text-violet-500 font-medium">Typing...</Text>
                            ) : (
                                <>
                                    <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                                    <Text className="text-xs text-green-600 font-medium">Online</Text>
                                </>
                            )}
                        </View>
                    </View>
                </View>
                <TouchableOpacity
                    className="bg-gray-50 p-2 rounded-full"
                    onPress={() => {
                        setChatHistory([{
                            id: Date.now(),
                            role: 'ai',
                            text: "Chat cleared! How can I help you?",
                            time: getTime(),
                        }]);
                        geminiHistory.current = [];
                    }}
                >
                    <Ionicons name="refresh-outline" size={20} color="#374151" />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                className="flex-1 px-4 py-4"
                contentContainerStyle={{ paddingBottom: 120 }}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {chatHistory.map((msg) => (
                    <View key={msg.id} className={`mb-6 flex-row ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'ai' && (
                            <View className="w-8 h-8 bg-violet-100 rounded-full items-center justify-center mr-2 self-start mt-1">
                                <Ionicons name="sparkles" size={14} color="#7C3AED" />
                            </View>
                        )}
                        <View className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.role === 'user'
                            ? 'bg-violet-600 rounded-tr-none'
                            : msg.isError
                                ? 'bg-red-50 border border-red-200 rounded-tl-none'
                                : 'bg-white border border-gray-100 rounded-tl-none'
                            }`}>
                            <Text className={`text-[15px] leading-6 ${msg.role === 'user' ? 'text-white' : msg.isError ? 'text-red-600' : 'text-gray-800'}`}>
                                {msg.text}
                            </Text>
                            <Text className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-violet-200' : 'text-gray-400'}`}>
                                {msg.time}
                            </Text>
                        </View>
                    </View>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                    <View className="mb-6 flex-row justify-start">
                        <View className="w-8 h-8 bg-violet-100 rounded-full items-center justify-center mr-2 self-start mt-1">
                            <Ionicons name="sparkles" size={14} color="#7C3AED" />
                        </View>
                        <View className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
                            <ActivityIndicator size="small" color="#7C3AED" />
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Input */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                style={{ position: 'absolute', bottom: 95, left: 0, right: 0, backgroundColor: 'transparent' }}
            >
                <View className="mx-4 mb-2 flex-row items-end space-x-2">
                    <View className="flex-1 flex-row items-end bg-white border border-gray-200 rounded-3xl px-4 py-2 shadow-sm">
                        <TextInput
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Ask me anything..."
                            placeholderTextColor="#9CA3AF"
                            style={{
                                flex: 1,
                                fontSize: 16,
                                color: '#1F2937',
                                paddingBottom: 12,
                                minHeight: 40,
                                maxHeight: 100
                            }}
                            multiline
                            editable={!isTyping}
                        />
                    </View>
                    <TouchableOpacity
                        onPress={handleSend}
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 6,
                            elevation: 5,
                            backgroundColor: message.trim() && !isTyping ? '#7C3AED' : '#E5E7EB'
                        }}
                        disabled={!message.trim() || isTyping}
                    >
                        {isTyping
                            ? <ActivityIndicator size="small" color="#9CA3AF" />
                            : <Ionicons name="arrow-up" size={24} color={message.trim() ? 'white' : '#9CA3AF'} />
                        }
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
