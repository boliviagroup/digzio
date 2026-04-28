import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { Colors, FontFamily, FontSize } from "../theme";

// Auth Screens
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";

// Provider Screens
import { ProviderDashboardScreen } from "../screens/provider/ProviderDashboardScreen";
import { ProviderPortfolioScreen } from "../screens/provider/ProviderPortfolioScreen";
import { ProviderApplicationsScreen } from "../screens/provider/ProviderApplicationsScreen";
import { ApplicationDetailScreen } from "../screens/provider/ApplicationDetailScreen";
import { PropertyDetailProviderScreen } from "../screens/provider/PropertyDetailProviderScreen";

// Student Screens
import { StudentDashboardScreen } from "../screens/student/StudentDashboardScreen";
import { PropertyFeedScreen } from "../screens/student/PropertyFeedScreen";
import { PropertyDetailStudentScreen } from "../screens/student/PropertyDetailStudentScreen";
import { ApplyScreen } from "../screens/student/ApplyScreen";
import { MyApplicationsScreen } from "../screens/student/MyApplicationsScreen";
import { KYCScreen } from "../screens/student/KYCScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab icon component
const TabIcon = ({
  label,
  focused,
  emoji,
}: {
  label: string;
  focused: boolean;
  emoji: string;
}) => (
  <View style={tabStyles.iconContainer}>
    <Text style={tabStyles.emoji}>{emoji}</Text>
    <Text
      style={[
        tabStyles.label,
        { color: focused ? Colors.teal : Colors.charcoal, opacity: focused ? 1 : 0.5 },
      ]}
    >
      {label}
    </Text>
  </View>
);

// Provider Tab Navigator
const ProviderTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: tabStyles.tabBar,
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="ProviderHome"
      component={ProviderDashboardScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="Overview" focused={focused} emoji="📊" />
        ),
      }}
    />
    <Tab.Screen
      name="Portfolio"
      component={ProviderPortfolioScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="Properties" focused={focused} emoji="🏠" />
        ),
      }}
    />
    <Tab.Screen
      name="Applications"
      component={ProviderApplicationsScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="Applications" focused={focused} emoji="📋" />
        ),
      }}
    />
  </Tab.Navigator>
);

// Student Tab Navigator
const StudentTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: tabStyles.tabBar,
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="StudentHome"
      component={StudentDashboardScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="Dashboard" focused={focused} emoji="🏡" />
        ),
      }}
    />
    <Tab.Screen
      name="Search"
      component={PropertyFeedScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="Search" focused={focused} emoji="🔍" />
        ),
      }}
    />
    <Tab.Screen
      name="MyApplications"
      component={MyApplicationsScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon label="Applications" focused={focused} emoji="📋" />
        ),
      }}
    />
  </Tab.Navigator>
);

// Auth Navigator
const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Root Navigator
export const RootNavigator = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : user?.role === "provider" ? (
          <>
            <Stack.Screen name="ProviderTabs" component={ProviderTabs} />
            <Stack.Screen
              name="ApplicationDetail"
              component={ApplicationDetailScreen}
              options={{ presentation: "modal" }}
            />
            <Stack.Screen
              name="PropertyDetailProvider"
              component={PropertyDetailProviderScreen}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="StudentTabs" component={StudentTabs} />
            <Stack.Screen
              name="PropertyDetailStudent"
              component={PropertyDetailStudentScreen}
            />
            <Stack.Screen
              name="Apply"
              component={ApplyScreen}
              options={{ presentation: "modal" }}
            />
            <Stack.Screen
              name="KYC"
              component={KYCScreen}
              options={{ presentation: "modal" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const tabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.mutedGrey,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
