import React, { useRef, useEffect, useState, memo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { WebView } from 'react-native-webview';
import { View, StyleSheet, BackHandler, ActivityIndicator, Alert } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUsers, faStore, faBriefcase } from '@fortawesome/free-solid-svg-icons';
import * as Facebook from 'expo-facebook';
import * as Updates from 'expo-updates';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';

const Stack = createStackNavigator();
const Tab = createMaterialTopTabNavigator();

const urls = [
  { title: 'Engage as Community', url: 'https://community.sheconomy.in', icon: faUsers },
  { title: 'Engage as Buyer', url: 'https://www.sheconomy.in', icon: faStore },
  { title: 'Engage as Seller', url: 'https://www.sheconomy.in/vendor.php', icon: faBriefcase },
];

const WebScreen = memo(({ url, onCanGoBackChange, tabTitle }) => {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  // useEffect(() => {
  //   if (Facebook.AppEvents) {
  //     Facebook.AppEvents.logEvent('tab_view', {
  //       tab: tabTitle,
  //       url: url,
  //     });
  //   }
  // }, [tabTitle, url]);

  const handleBackPress = () => {
    if (canGoBack) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [canGoBack]);

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" style={styles.loadingIndicator} />}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webView}
        cacheEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator size="large" style={styles.loadingIndicator} />}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
          onCanGoBackChange(navState.canGoBack);
        }}
        onShouldStartLoadWithRequest={(request) => {
          // Optionally, handle request
          return true;
        }}
        injectedJavaScript={`document.addEventListener('DOMContentLoaded', () => {
          const images = document.querySelectorAll('img');
          images.forEach(img => {
            if (img.hasAttribute('data-src')) {
              img.src = img.getAttribute('data-src');
              img.removeAttribute('data-src');
            }
          });
        });`}
        onLoadProgress={({ nativeEvent }) => {
          if (nativeEvent.progress === 1) {
            setLoading(false);
          }
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('HTTP error', nativeEvent);
          setLoading(false);
        }}
      />
    </View>
  );
});

const HomeScreen = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const switchTab = (index) => {
    setActiveTabIndex(index);
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarLabelStyle: { fontSize: 12, margin: 0, color: '#F23472' },
        tabBarStyle: { backgroundColor: '#ffffff', paddingTop: 20 },
        swipeEnabled: false,
        tabBarActiveTintColor: '#F23472',
        tabBarInactiveTintColor: '#F23472',
      }}
      initialRouteName={`WebView${activeTabIndex}`}
    >
      {urls.map((site, index) => (
        <Tab.Screen
          key={index}
          name={`WebView${index}`}
          options={{
            tabBarLabel: site.title,
            tabBarIcon: () => (
              <FontAwesomeIcon
                icon={site.icon}
                size={20}
                color={'#F23472'}
                style={{ margin: 0 }}
              />
            ),
          }}
        >
          {() => (
            <WebScreen
              url={site.url}
              tabTitle={site.title}
              onCanGoBackChange={(canGoBack) => {
                if (!canGoBack) {
                  const nextIndex = (activeTabIndex + 1) % urls.length;
                  switchTab(nextIndex);
                }
              }}
            />
          )}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
};

// Main App Component
export default function App() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      const checkForUpdates = async () => {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            Alert.alert(
              'Update Available',
              'A new version of the app is available. Please restart the app to get the latest version.',
              [{ text: 'Restart', onPress: () => Updates.reloadAsync() }]
            );
          }
        } catch (e) {
          console.error('Error checking for updates:', e);
        }
      };

      checkForUpdates();
    }
  }, []);

  // useEffect(() => {
  //   const initFacebook = async () => {
  //     try {
  //       await Facebook.initializeAsync({
  //         appId:'1234', 
  //       });
  //       Facebook.AppEvents.activateApp();
  //     } catch (e) {
  //       console.error('Error initializing Facebook SDK:', e);
  //     }
  //   };

  //   initFacebook();
  // }, []);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        
        if (cameraStatus !== 'granted') {
          alert('Camera permission is required.');
        }
        if (locationStatus !== 'granted') {
          alert('Location permission is required.');
        }
      } catch (e) {
        console.error('Error requesting permissions:', e);
      }
    };

    requestPermissions();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
  },
});
