import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

export default function Input({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    icon,
    style,
    inputContainerStyle,
    placeholderTextColor,
    ...props
}) {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputContainer, inputContainerStyle]}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <TextInput
                    style={[styles.input, style]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={placeholderTextColor || COLORS.textInactive}
                    secureTextEntry={!!secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    {...props}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: SIZES.base * 2.5,
    },
    label: {
        marginBottom: SIZES.base,
        ...FONTS.body4,
        color: COLORS.textBody,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBackground,
        borderRadius: SIZES.radius,
        paddingHorizontal: SIZES.padding / 2,
    },
    iconContainer: {
        marginRight: SIZES.base,
        marginLeft: SIZES.base / 2,
    },
    input: {
        flex: 1,
        paddingVertical: SIZES.padding / 1.5,
        paddingHorizontal: SIZES.base,
        ...FONTS.body3,
        color: COLORS.textHeading,
    },
});
