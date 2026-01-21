import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  style,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 200,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 200,
    }).start();
  };

  const isDefault = variant === 'default';

  const { flex, flexGrow, flexShrink, margin, marginHorizontal, marginVertical, marginTop, marginBottom, marginLeft, marginRight, ...otherStyle } = style || {};

  return (
    <Animated.View style={{
      transform: [{ scale }],
      flex,
      flexGrow,
      flexShrink,
      margin,
      marginHorizontal,
      marginVertical,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
    }}>
      <TouchableOpacity
        style={[
          styles.button,
          !isDefault && styles[`button_${size}`],
          !isDefault && styles[`button_${variant}`],
          disabled && styles.button_disabled,
          otherStyle,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {isDefault ? (
          <LinearGradient
            colors={['#1e293b', '#334155']} // from-slate-800 to-slate-700
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, styles[`button_${size}`]]}
          >
            {typeof children === 'string' ? (
              <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`], disabled && styles.text_disabled]}>
                {children}
              </Text>
            ) : children}
          </LinearGradient>
        ) : (
          typeof children === 'string' ? (
            <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`], disabled && styles.text_disabled]}>
              {children}
            </Text>
          ) : children
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  gradient: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  button_default: {
    // Handled by LinearGradient
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  button_destructive: {
    backgroundColor: '#ef4444',
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_sm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  button_md: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  button_lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  button_disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  text_default: {
    color: '#ffffff',
  },
  text_outline: {
    color: '#334155',
  },
  text_destructive: {
    color: '#ffffff',
  },
  text_ghost: {
    color: '#334155',
  },
  text_sm: {
    fontSize: 14,
  },
  text_md: {
    fontSize: 15,
  },
  text_lg: {
    fontSize: 16,
  },
  text_disabled: {
    opacity: 0.5,
  },
});
