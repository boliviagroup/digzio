import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, FontFamily, FontSize, BorderRadius, Gradients } from "../../theme";

type ButtonVariant = "primary" | "navy" | "outline" | "ghost" | "danger";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const isDisabled = disabled || loading;

  if (variant === "primary") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.wrapper, fullWidth && styles.fullWidth, style]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, isDisabled && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={[styles.primaryText, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const containerStyle = [
    styles.base,
    fullWidth && styles.fullWidth,
    variant === "navy" && styles.navyBg,
    variant === "outline" && styles.outlineBorder,
    variant === "danger" && styles.dangerBg,
    isDisabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.baseText,
    variant === "navy" && styles.whiteText,
    variant === "outline" && styles.navyText,
    variant === "ghost" && styles.tealText,
    variant === "danger" && styles.whiteText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={containerStyle}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "ghost" ? Colors.teal : Colors.white}
          size="small"
        />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  fullWidth: {
    width: "100%",
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
  },
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
  },
  navyBg: {
    backgroundColor: Colors.navy,
  },
  outlineBorder: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: Colors.navy,
  },
  dangerBg: {
    backgroundColor: Colors.error,
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: Colors.white,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    letterSpacing: 0.3,
  },
  baseText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    letterSpacing: 0.3,
  },
  whiteText: {
    color: Colors.white,
  },
  navyText: {
    color: Colors.navy,
  },
  tealText: {
    color: Colors.teal,
  },
});
