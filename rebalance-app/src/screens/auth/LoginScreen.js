import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { supabase } from '../../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Animation Values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    // Staggered Animations for Form Elements
    const input1Anim = useRef(new Animated.Value(0)).current;
    const input2Anim = useRef(new Animated.Value(0)).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Main Screen Entrance
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: false,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: false, // Fixed
            })
        ]).start();

        // Staggered Form Entrance
        Animated.stagger(100, [
            Animated.timing(input1Anim, { toValue: 1, duration: 500, useNativeDriver: false, delay: 300 }),
            Animated.timing(input2Anim, { toValue: 1, duration: 500, useNativeDriver: false }),
            Animated.timing(buttonAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
        ]).start();
    }, []);

    async function signInWithEmail() {
        if (loading) return;
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Alert.alert('Login Failed', error.message);
        }
        setLoading(false);
    }

    const input1Style = { opacity: input1Anim, transform: [{ translateY: input1Anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] };
    const input2Style = { opacity: input2Anim, transform: [{ translateY: input2Anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] };
    const buttonStyle = { opacity: buttonAnim, transform: [{ translateY: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={COLORS.textHeading} />
                        </TouchableOpacity>

                        <View style={styles.header}>
                            <Image
                                source={require('../../../assets/rebalance_final_v11_transparent.png')}
                                style={styles.miniLogo}
                                resizeMode="contain"
                            />
                            <Text style={[styles.title, { color: '#FFFFFF' }]}>Welcome Back!</Text>
                            <Text style={[styles.subtitle, { color: '#AAAAAA' }]}>Sign in to continue.</Text>
                        </View>

                        <View style={styles.form}>
                            <Animated.View style={input1Style}>
                                <Input
                                    label="Email Address"
                                    placeholder="example@email.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    icon={<Ionicons name="mail-outline" size={20} color={COLORS.textSubtle} />}
                                    inputContainerStyle={{ backgroundColor: '#1E293B', borderWidth: 0 }} // Dark background
                                    style={{ color: '#FFFFFF' }} // White text
                                    placeholderTextColor="#64748B"
                                />
                            </Animated.View>

                            <Animated.View style={input2Style}>
                                <Input
                                    label="Password"
                                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={true}
                                    icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textSubtle} />}
                                    inputContainerStyle={{ backgroundColor: '#1E293B', borderWidth: 0 }}
                                    style={{ color: '#FFFFFF' }}
                                    placeholderTextColor="#64748B"
                                />
                                <TouchableOpacity style={styles.forgotPassword}>
                                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </Animated.View>

                            <Animated.View style={buttonStyle}>
                                <Button
                                    title="Sign In"
                                    onPress={signInWithEmail}
                                    loading={loading}
                                    style={styles.loginButton}
                                />
                            </Animated.View>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.linkText}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scrollContent: {
        flexGrow: 1,
        padding: SIZES.padding,
    },
    backButton: {
        marginBottom: SIZES.padding,
    },
    header: {
        marginBottom: SIZES.padding * 1.5,
    },
    miniLogo: {
        width: 60,
        height: 60,
        marginBottom: SIZES.base,
    },
    title: {
        ...FONTS.h1,
        color: COLORS.textHeading,
        marginBottom: SIZES.base,
    },
    subtitle: {
        ...FONTS.body3,
        color: COLORS.textSubtle,
    },
    form: {
        marginBottom: SIZES.padding,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: SIZES.padding,
        marginTop: SIZES.base,
    },
    forgotPasswordText: {
        ...FONTS.body4,
        color: COLORS.primary,
        fontWeight: '600',
    },
    loginButton: {
        marginTop: SIZES.base,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 40,
        marginBottom: SIZES.padding,
    },
    footerText: {
        ...FONTS.body4,
        color: COLORS.textSubtle,
    },
    linkText: {
        ...FONTS.body4,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});
