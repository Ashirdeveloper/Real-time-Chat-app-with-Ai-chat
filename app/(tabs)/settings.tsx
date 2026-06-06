import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Edit Profile Modal State
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Avatar Upload State
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (user) fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
            if (error) throw error;
            setProfile(data);
            setEditName(data?.full_name || '');
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!editName.trim()) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.from('profiles').update({ full_name: editName.trim() }).eq('id', user?.id);
            if (error) throw error;
            setProfile({ ...profile, full_name: editName.trim() });
            setEditModalVisible(false);
        } catch (error: any) {
            Alert.alert('Error updating profile', error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/login');
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                const imageUri = result.assets[0].uri;
                setSelectedImage(imageUri);
                await uploadAvatar(imageUri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const uploadAvatar = async (imageUri: string) => {
        if (!user) return;
        
        setIsUploadingAvatar(true);
        try {
            // Convert URI to blob
            const response = await fetch(imageUri);
            const blob = await response.blob();
            
            // Generate unique filename
            const filename = `${user.id}-${Date.now()}.jpg`;
            const filePath = `avatars/${filename}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const publicUrl = data.publicUrl;

            // Update profile with avatar URL
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setProfile({ ...profile, avatar_url: publicUrl });
            Alert.alert('Success', 'Avatar updated successfully!');
            setSelectedImage(null);
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            Alert.alert('Error', error.message || 'Failed to upload avatar');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    if (loading && !profile) {
        return (
            <SafeAreaView className="flex-1 bg-white dark:bg-gray-900 justify-center items-center">
                <ActivityIndicator size="large" color="#8B5CF6" />
            </SafeAreaView>
        );
    }

    // Get initials for avatar fallback
    const initials = profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'U';

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
            {/* Profile Header */}
            <View className="bg-purple-600 pt-10 pb-20 px-6 rounded-b-3xl items-center shadow-lg">
                <TouchableOpacity onPress={handlePickImage} disabled={isUploadingAvatar}>
                    <View className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full p-1 mb-3">
                        <View className="w-full h-full bg-purple-100 dark:bg-purple-900 rounded-full items-center justify-center overflow-hidden">
                            {profile?.avatar_url || selectedImage ? (
                                <Image 
                                    source={{ uri: selectedImage || profile?.avatar_url }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <Text className="text-3xl font-bold text-purple-600 dark:text-purple-300">{initials}</Text>
                            )}
                        </View>
                        <View className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 rounded-full p-1.5 shadow-sm">
                            {isUploadingAvatar ? (
                                <ActivityIndicator size="small" color="#8B5CF6" />
                            ) : (
                                <Ionicons name="camera" size={16} color="#8B5CF6" />
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
                <Text className="text-white text-2xl font-bold">{profile?.full_name || 'User'}</Text>
                <Text className="text-purple-200 mt-1">{user?.email}</Text>

                <TouchableOpacity
                    onPress={() => setEditModalVisible(true)}
                    className="mt-5 px-6 py-2.5 bg-white/20 rounded-full border border-white/30 backdrop-blur-md active:bg-white/30"
                >
                    <Text className="text-white font-medium">Edit Profile</Text>
                </TouchableOpacity>
            </View>

            {/* Settings Content */}
            <View className="flex-1 px-6 -mt-10">
                <View className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 overflow-hidden">

                    {/* Notifications */}
                    <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-50 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-700/50">
                        <View className="w-9 h-9 bg-amber-50 dark:bg-amber-900/50 rounded-full items-center justify-center">
                            <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
                        </View>
                        <Text className="ml-3 text-gray-700 dark:text-gray-200 font-medium flex-1 text-base">Notifications</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    {/* Privacy */}
                    <TouchableOpacity className="flex-row items-center p-4 active:bg-gray-50 dark:active:bg-gray-700/50">
                        <View className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/50 rounded-full items-center justify-center">
                            <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
                        </View>
                        <Text className="ml-3 text-gray-700 dark:text-gray-200 font-medium flex-1 text-base">Privacy & Security</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    onPress={handleLogout}
                    className="flex-row items-center justify-center mt-12 bg-red-50 dark:bg-red-900/20 py-4 rounded-2xl border border-red-100 dark:border-red-900/30 active:bg-red-100 dark:active:bg-red-900/40"
                >
                    <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                    <Text className="ml-2 text-red-500 font-bold text-lg">Sign Out</Text>
                </TouchableOpacity>
            </View>

            {/* Edit Profile Modal */}
            <Modal
                visible={isEditModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={{ flex: 1 }}>
                    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                        <View className="flex-1 justify-end bg-black/50">
                            <View className="bg-white dark:bg-gray-800 rounded-t-3xl p-6 shadow-xl border-t border-gray-200 dark:border-gray-700">

                                <View className="flex-row justify-between items-center mb-6">
                                    <Text className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</Text>
                                    <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                                        <Ionicons name="close" size={20} color="#4B5563" />
                                    </TouchableOpacity>
                                </View>

                                <View className="mb-6">
                                    <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 ml-1">Full Name</Text>
                                    <TextInput
                                        value={editName}
                                        onChangeText={setEditName}
                                        placeholder="Your Name"
                                        placeholderTextColor="#9CA3AF"
                                        className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-base text-gray-900 dark:text-white"
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handleUpdateProfile}
                                    disabled={isSaving || !editName.trim()}
                                    className={`py-4 rounded-2xl items-center flex-row justify-center ${(isSaving || !editName.trim()) ? 'bg-purple-400' : 'bg-purple-600'}`}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                                            <Text className="text-white font-bold text-lg ml-2">Save Changes</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <View className="h-4" />
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
