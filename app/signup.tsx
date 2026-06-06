import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function SignupScreen() {
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignup = async () => {
        if (!email || !password || !fullName) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    avatar_url: 'https://i.pravatar.cc/150?u=' + Date.now(),
                }
            }
        });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.replace('/(tabs)/chats');
        }
        setLoading(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-white p-6 justify-center">
            <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-6 z-10 p-2 bg-gray-50 rounded-full">
                <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>

            <View className="items-center mb-10">
                <Text className="text-3xl font-bold text-gray-900">Create Account</Text>
                <Text className="text-gray-500 mt-2">Join us and start chatting</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-gray-700 font-medium mb-2 ml-1">Full Name</Text>
                    <TextInput
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-700"
                        placeholder="John Doe"
                        placeholderTextColor="#9CA3AF"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                </View>

                <View>
                    <Text className="text-gray-700 font-medium mb-2 ml-1">Email</Text>
                    <TextInput
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-700"
                        placeholder="john@example.com"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <View>
                    <Text className="text-gray-700 font-medium mb-2 ml-1">Password</Text>
                    <TextInput
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-700"
                        placeholder="••••••••"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>

                <TouchableOpacity onPress={handleSignup} disabled={loading} className="bg-purple-600 rounded-xl py-4 items-center mt-4 shadow-lg shadow-purple-200">
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Sign Up</Text>
                    )}
                </TouchableOpacity>

                <View className="flex-row justify-center mt-6">
                    <Text className="text-gray-500">Already have an account? </Text>
                    <Link href="/login" asChild>
                        <TouchableOpacity>
                            <Text className="text-purple-600 font-bold">Log In</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </SafeAreaView>
    );
}
