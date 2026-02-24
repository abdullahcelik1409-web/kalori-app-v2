import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback, StyleSheet, View, Platform } from 'react-native';

/**
 * Premium hissiyat veren, basÄ±ldÄ±ÄŸÄ±nda yaylanma (scale) efekti yapan buton bileÅŸeni.
 */
const AnimatedButton = ({ children, onPress, style, scaleTo = 0.95, disabled = false }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (disabled) return;
        Animated.spring(scaleAnim, {
            toValue: scaleTo,
            useNativeDriver: false,
            friction: 4,
            tension: 40
        }).start();
    };

    const handlePressOut = () => {
        if (disabled) return;
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: false,
            friction: 4,
            tension: 40
        }).start();
    };

    return (
        <TouchableWithoutFeedback
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!!disabled}
        >
            <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
                {children}
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

export default AnimatedButton;
