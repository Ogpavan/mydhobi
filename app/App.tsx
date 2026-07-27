import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";

const APP_URL = "https://mydhobi.vercel.app/";
const APP_ORIGIN = new URL(APP_URL).origin;

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 350,
  fade: true,
});

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const hideSplash = useCallback(() => {
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    const fallbackTimer = setTimeout(hideSplash, 8000);
    return () => clearTimeout(fallbackTimer);
  }, [hideSplash]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!canGoBack) {
          return false;
        }

        webViewRef.current?.goBack();
        return true;
      },
    );

    return () => subscription.remove();
  }, [canGoBack]);

  const handleNavigationChange = useCallback((state: WebViewNavigation) => {
    setCanGoBack(state.canGoBack);
  }, []);

  const handleRequest = useCallback((request: { url: string }) => {
    if (
      request.url === "about:blank" ||
      request.url.startsWith(APP_ORIGIN)
    ) {
      return true;
    }

    void Linking.openURL(request.url);
    return false;
  }, []);

  const reload = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        {hasError ? (
          <View style={styles.message}>
            <Text style={styles.title}>Unable to open MyDhobi</Text>
            <Text style={styles.body}>Check your internet and try again.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={reload}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
            >
              <Text style={styles.retryLabel}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <WebView
              ref={webViewRef}
              source={{ uri: APP_URL }}
              originWhitelist={["https://*", "tel:*", "mailto:*"]}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              pullToRefreshEnabled
              setSupportMultipleWindows={false}
              allowsBackForwardNavigationGestures
              onNavigationStateChange={handleNavigationChange}
              onShouldStartLoadWithRequest={handleRequest}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => {
                setIsLoading(false);
                hideSplash();
              }}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
                hideSplash();
              }}
              style={styles.webView}
            />

            {isLoading ? (
              <View pointerEvents="none" style={styles.loading}>
                <ActivityIndicator color="#7440DC" size="large" />
              </View>
            ) : null}
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F0FF",
  },
  webView: {
    flex: 1,
    backgroundColor: "#FAFAFE",
  },
  loading: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F0FF",
  },
  message: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#FAFAFE",
  },
  title: {
    color: "#251F58",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    marginTop: 8,
    color: "#66617C",
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    minWidth: 132,
    height: 46,
    marginTop: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#7440DC",
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
