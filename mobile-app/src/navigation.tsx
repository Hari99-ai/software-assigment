import React from "react";
import { router, useLocalSearchParams } from "expo-router";
const paths: Record<string, string> = {
  Main: "/(tabs)",
  Home: "/(tabs)",
  Products: "/(tabs)/products",
  Cart: "/(tabs)/cart",
  Orders: "/(tabs)/orders",
  Profile: "/(tabs)/profile",
};
export function RoutedScreen({
  screen: Screen,
}: {
  screen: React.ComponentType<any>;
}) {
  const params = useLocalSearchParams();
  const href = (name: string, values?: Record<string, unknown>) =>
    ({ pathname: paths[name] || `/${name}`, params: values }) as any;
  const navigation = {
    navigate: (name: string, values?: Record<string, unknown>) =>
      router.push(href(name, values)),
    replace: (name: string, values?: Record<string, unknown>) =>
      router.replace(href(name, values)),
    goBack: () =>
      router.canGoBack() ? router.back() : router.replace("/(tabs)"),
  };
  return (
    <Screen
      key={String(params.category || "") + String(params.query || "")}
      route={{ params }}
      navigation={navigation}
    />
  );
}
