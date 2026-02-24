import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const LIGHT_COLORS = {
    // Brand Colors
    primary: '#10B981',
    primaryDark: '#059669',
    primaryLight: '#D1FAE5',
    secondary: '#3B82F6',
    accent: '#F59E0B',

    // Macro Nutrients
    protein: '#3B82F6',
    carbs: '#F59E0B',
    fat: '#EF4444',
    water: '#0EA5E9',

    // Neutrals / Backgrounds
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceHighlight: '#F1F5F9',
    surfaceElevated: 'rgba(255, 255, 255, 0.8)',

    // Text
    textHeading: '#0F172A',
    textBody: '#334155',
    textSubtle: '#64748B',
    textInactive: '#94A3B8',
    textInverted: '#FFFFFF',

    // Utility
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    // UI Specific
    border: '#E2E8F0',
    inputBackground: '#F8FAFC',

    // Overlays
    overlay: 'rgba(15, 23, 42, 0.4)',
    white: '#FFFFFF',
    transparent: 'transparent',
};

export const DARK_COLORS = {
    // Brand Colors
    primary: '#10B981',
    primaryDark: '#059669',
    primaryLight: 'rgba(16, 185, 129, 0.15)',
    secondary: '#3B82F6',
    accent: '#F59E0B',

    // Macro Nutrients
    protein: '#60A5FA',
    carbs: '#FBBF24',
    fat: '#F87171',
    water: '#38BDF8',

    // Neutrals / Backgrounds
    background: '#0F172A',
    surface: '#1E293B',
    surfaceHighlight: '#334155',
    surfaceElevated: 'rgba(30, 41, 59, 0.8)',

    // Text
    textHeading: '#F8FAFC',
    textBody: '#CBD5E1',
    textSubtle: '#94A3B8',
    textInactive: '#64748B',
    textInverted: '#0F172A',

    // Utility
    success: '#10B981',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#38BDF8',

    // UI Specific
    border: '#334155',
    inputBackground: '#0F172A',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.6)',
    white: '#FFFFFF',
    transparent: 'transparent',
};

export const COLORS = DARK_COLORS; // Default to dark for premium look and visibility on black BG

export const SIZES = {
    // Global Sizing
    base: 8,
    font: 14,
    radius: 16,
    padding: 24,

    // Font Sizes
    h1: 30,
    h2: 22,
    h3: 18,
    h4: 16,
    body1: 30,
    body2: 20,
    body3: 16,
    body4: 14,
    body5: 12,

    // App Dimensions
    width,
    height,
};

export const SHADOWS = {
    light: {
        ...Platform.select({
            web: {
                boxShadow: '0px 2px 3.84px rgba(15, 23, 42, 0.05)',
            },
            default: {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3.84,
                elevation: 2,
            }
        })
    },
    medium: {
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 5.84px rgba(15, 23, 42, 0.1)',
            },
            default: {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 5.84,
                elevation: 5,
            }
        })
    },
    dark: {
        ...Platform.select({
            web: {
                boxShadow: '0px 8px 8.84px rgba(15, 23, 42, 0.2)',
            },
            default: {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 8.84,
                elevation: 10,
            }
        })
    },
};

export const FONTS = {
    // Premium görünüm için sistem fontlarını ve ağırlıklarını optimize ediyoruz.
    h1: { fontSize: SIZES.h1, fontWeight: '800', letterSpacing: -1, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium' },
    h2: { fontSize: SIZES.h2, fontWeight: '700', letterSpacing: -0.5, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium' },
    h3: { fontSize: SIZES.h3, fontWeight: '600', letterSpacing: -0.3, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium' },
    h4: { fontSize: SIZES.h4, fontWeight: '600', letterSpacing: -0.2, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium' },
    body1: { fontSize: SIZES.body1, fontWeight: '400', fontFamily: 'System' },
    body2: { fontSize: SIZES.body2, fontWeight: '400', fontFamily: 'System' },
    body3: { fontSize: SIZES.body3, fontWeight: '500', fontFamily: 'System' },
    body4: { fontSize: SIZES.body4, fontWeight: '400', fontFamily: 'System' },
    body5: { fontSize: SIZES.body5, fontWeight: '400', fontFamily: 'System' },
};

const appTheme = { COLORS, SIZES, SHADOWS, FONTS };

export default appTheme;
