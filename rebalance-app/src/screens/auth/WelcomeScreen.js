import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Image, TouchableOpacity, Animated, Easing, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

export default function WelcomeScreen({ navigation }) {
    // Animation Values
    const blob1Anim = useRef(new Animated.Value(0)).current;
    const blob2Anim = useRef(new Animated.Value(0)).current;
    const blob3Anim = useRef(new Animated.Value(0)).current;

    // Content Entrance Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        // Floating Blob Animations (Infinite Loop)
        const createFloatingAnim = (animValue, duration, delay) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(animValue, {
                        toValue: 1,
                        duration: duration,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                        delay: delay,
                    }),
                    Animated.timing(animValue, {
                        toValue: 0,
                        duration: duration,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    })
                ])
            );
        };

        createFloatingAnim(blob1Anim, 4000, 0).start();
        createFloatingAnim(blob2Anim, 5000, 500).start();
        createFloatingAnim(blob3Anim, 4500, 1000).start();

        // Entrance Animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: false,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: false, // Fixed
            })
        ]).start();

    }, []);

    // Interpolations for Blobs
    const blob1TranslateY = blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
    const blob1Scale = blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

    const blob2TranslateY = blob2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
    const blob2Scale = blob2Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });

    const blob3TranslateY = blob3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
    const blob3TranslateX = blob3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />

            <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
                <View style={styles.content}>
                    {/* Background Blobs Layer */}
                    <View style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' }]}>
                        <Animated.View style={[
                            styles.blob,
                            styles.blob1,
                            { transform: [{ translateY: blob1TranslateY }, { scale: blob1Scale }] }
                        ]} />
                        <Animated.View style={[
                            styles.blob,
                            styles.blob2,
                            { transform: [{ translateY: blob2TranslateY }, { scale: blob2Scale }] }
                        ]} />
                        <Animated.View style={[
                            styles.blob,
                            styles.blob3,
                            { transform: [{ translateY: blob3TranslateY }, { translateX: blob3TranslateX }] }
                        ]} />
                    </View>

                    {/* Main Content */}
                    <Animated.View style={[styles.mainContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.headerContainer}>
                            <Image
                                source={require('../../../assets/rebalance_final_v11_transparent.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <Text style={[styles.tagline, { color: '#E0E0E0' }]}>Balance your life, effortlessly.</Text>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.description}>
                                Track calories, monitor progress, and achieve your health goals with a <Text style={{ fontWeight: '700', color: COLORS.primary }}>rebalanced</Text> lifestyle.
                            </Text>

                            <View style={styles.buttonContainer}>
                                <Button
                                    title="Get Started"
                                    onPress={() => navigation.navigate('Register')}
                                    style={styles.primaryButton}
                                />

                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Login')}
                                    style={styles.secondaryTextButton}
                                >
                                    <Text style={styles.secondaryButtonText}>I already have an account</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Contain blobs
    },
    mainContent: {
        flex: 1,
        width: '100%',
        padding: SIZES.padding,
        justifyContent: 'space-between',
        zIndex: 10,
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: SIZES.height * 0.1,
    },
    logoImage: {
        width: 180,
        height: 180,
        marginBottom: SIZES.base,
    },
    tagline: {
        ...FONTS.body3,
        color: COLORS.textSubtle,
        textAlign: 'center',
        marginTop: 0,
        letterSpacing: 0.5,
    },
    // Premium Blurred Blobs
    blob: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.3, // Subtle aesthetic
    },
    blob1: {
        width: 300,
        height: 300,
        backgroundColor: COLORS.primary,
        top: -50,
        left: -80,
        ...Platform.select({
            web: {
                boxShadow: `0px 10px 50px ${COLORS.primary}80`, // 50% opacity
            },
            default: {
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 50,
                elevation: 10,
            }
        })
    },
    blob2: {
        width: 250,
        height: 250,
        backgroundColor: COLORS.secondary,
        bottom: -50,
        right: -50,
        opacity: 0.25,
    },
    blob3: {
        width: 200,
        height: 200,
        backgroundColor: COLORS.accent,
        top: '40%',
        right: -80,
        opacity: 0.2,
    },
    footer: {
        marginBottom: SIZES.padding * 2,
    },
    description: {
        ...FONTS.body3,
        color: '#BBBBBB',
        textAlign: 'center',
        marginBottom: SIZES.padding * 2,
        lineHeight: 26,
        paddingHorizontal: SIZES.padding,
    },
    buttonContainer: {
        gap: SIZES.base,
    },
    primaryButton: {
        height: 56,
        borderRadius: 16,
    },
    secondaryTextButton: {
        paddingVertical: SIZES.base * 1.5,
        alignItems: 'center',
    },
    secondaryButtonText: {
        ...FONTS.body4,
        fontWeight: '600',
        color: '#888888',
    },
});
