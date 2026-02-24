import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Platform } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';

export default function Button({ title, onPress, variant = 'primary', loading = false, style, icon }) {
    const isPrimary = variant === 'primary';
    const isSecondary = variant === 'secondary';

    // Background Color
    let backgroundColor = 'transparent';
    if (isPrimary) backgroundColor = COLORS.primary;
    if (isSecondary) backgroundColor = COLORS.surface;

    // Text Color
    let textColor = COLORS.primary;
    if (isPrimary) textColor = COLORS.white;
    if (isSecondary) textColor = COLORS.textBody;

    // Container Style
    const containerStyle = [
        styles.container,
        { backgroundColor },
        isPrimary && styles.primaryShadow,
        isSecondary && styles.secondaryBorder,
        style
    ];

    return (
        <TouchableOpacity
            style={containerStyle}
            onPress={onPress}
            disabled={!!loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={textColor} />
            ) : (
                <View style={styles.contentContainer}>
                    {icon && <View style={styles.iconWrapper}>{icon}</View>}
                    <Text style={[styles.text, { color: textColor }]}>{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: SIZES.base * 2,
        paddingHorizontal: SIZES.padding,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: SIZES.base,
        minHeight: 55,
    },
    primaryShadow: {
        ...Platform.select({
            web: {
                boxShadow: `0px 4px 8px ${COLORS.primary}4D`, // 4D = 30% alpha
            },
            default: {
                shadowColor: COLORS.primary,
                shadowOffset: {
                    width: 0,
                    height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
            }
        })
    },
    secondaryBorder: {
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapper: {
        marginRight: SIZES.base,
    },
    text: {
        ...FONTS.h3,
        fontWeight: 'bold',
    },
});
