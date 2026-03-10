/**
 * 🛡️ ERROR BOUNDARY
 * 
 * React Error Boundary to catch JavaScript errors anywhere in the component tree,
 * log those errors, and display a fallback UI instead of crashing.
 * 
 * Features:
 * - Catches errors in render, lifecycle methods, and constructors
 * - Displays user-friendly error UI
 * - Logs errors for debugging (integrates with Sentry, Bugsnag, etc.)
 * - Provides "Try Again" functionality
 * - Development vs Production UI
 * 
 * @module ErrorBoundary
 * @version 2.0.0 - Updated for React 19.2 (marzo 2026)
 */

import React, { Component } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

// ============================================
// 🎨 STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    maxWidth: 500,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonPressed: {
    backgroundColor: '#0056b3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  detailsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    maxHeight: 300,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  stackText: {
    fontSize: 11,
    color: '#6c757d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
  },
});

// ============================================
// 🛡️ ERROR BOUNDARY CLASS
// ============================================

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: __DEV__, // Auto-show details in development
    };
  }

  /**
   * React lifecycle: Update state when error occurs
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * React lifecycle: Log error details
   */
  componentDidCatch(error, errorInfo) {
    this.setState({
      errorInfo,
    });

    // Log to console in development
    if (__DEV__) {
      console.error('🛑 [ErrorBoundary] Caught error:', error);
      console.error('🛑 [ErrorBoundary] Error info:', errorInfo);
    }

    // Send to error tracking service (Sentry, Bugsnag, etc.)
    this.logErrorToService(error, errorInfo);
  }

  /**
   * Log error to external service
   */
  logErrorToService = (error, errorInfo) => {
    try {
      // TODO: Integrate with your error tracking service
      // Examples:
      
      // Sentry
      // import * as Sentry from '@sentry/react-native';
      // Sentry.captureException(error, {
      //   contexts: {
      //     react: {
      //       componentStack: errorInfo.componentStack,
      //     },
      //   },
      // });

      // Bugsnag
      // import Bugsnag from '@bugsnag/react-native';
      // Bugsnag.notify(error, (event) => {
      //   event.addMetadata('react', {
      //     componentStack: errorInfo.componentStack,
      //   });
      // });

      // Custom API
      // fetch('https://your-api.com/log-error', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     error: error.toString(),
      //     stack: error.stack,
      //     componentStack: errorInfo.componentStack,
      //     appVersion: Application.nativeApplicationVersion,
      //     platform: Platform.OS,
      //   }),
      // });

      console.log('✅ [ErrorBoundary] Error logged to service');
    } catch (loggingError) {
      console.error('❌ [ErrorBoundary] Failed to log error:', loggingError);
    }
  };

  /**
   * Reset error state and try again
   */
  handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Toggle error details visibility
   */
  toggleDetails = () => {
    this.setState(prev => ({
      showDetails: !prev.showDetails,
    }));
  };

  /**
   * Render custom fallback UI if provided
   */
  renderCustomFallback() {
    const { fallback, fallbackComponent: FallbackComponent } = this.props;
    const { error, errorInfo } = this.state;

    if (FallbackComponent) {
      return (
        <FallbackComponent
          error={error}
          errorInfo={errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    if (fallback) {
      return fallback({ error, errorInfo, onReset: this.handleReset });
    }

    return null;
  }

  /**
   * Render default error UI
   */
  renderDefaultError() {
    const { error, errorInfo, showDetails } = this.state;
    const isDev = __DEV__;

    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.emoji}>😵</Text>
          
          <Text style={styles.title}>
            {isDev ? 'Error en la aplicación' : 'Algo salió mal'}
          </Text>
          
          <Text style={styles.message}>
            {isDev
              ? 'Se produjo un error inesperado. Los detalles están abajo.'
              : 'Disculpa las molestias. Intenta reiniciar la aplicación.'}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={this.handleReset}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Intentar de nuevo"
          >
            <Text style={styles.buttonText}>Intentar de nuevo</Text>
          </Pressable>

          {isDev && (
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={this.toggleDetails}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={showDetails ? 'Ocultar detalles' : 'Ver detalles'}
            >
              <Text style={styles.buttonText}>
                {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
              </Text>
            </Pressable>
          )}

          {isDev && showDetails && (
            <ScrollView style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Error:</Text>
              <Text style={styles.errorText}>
                {error?.toString() || 'No error message'}
              </Text>

              {error?.stack && (
                <>
                  <Text style={[styles.detailsTitle, { marginTop: 12 }]}>
                    Stack:
                  </Text>
                  <Text style={styles.stackText}>{error.stack}</Text>
                </>
              )}

              {errorInfo?.componentStack && (
                <>
                  <Text style={[styles.detailsTitle, { marginTop: 12 }]}>
                    Component Stack:
                  </Text>
                  <Text style={styles.stackText}>
                    {errorInfo.componentStack}
                  </Text>
                </>
              )}
            </ScrollView>
          )}

          <Text style={styles.infoText}>
            {Application.nativeApplicationVersion || 'v1.0.0'} • {Platform.OS} {Platform.Version}
          </Text>
        </View>
      </View>
    );
  }

  render() {
    if (this.state.hasError) {
      const customFallback = this.renderCustomFallback();
      return customFallback || this.renderDefaultError();
    }

    return this.props.children;
  }
}

// ============================================
// 📤 EXPORTS
// ============================================

export default ErrorBoundary;

// ============================================
// 📖 USAGE EXAMPLES
// ============================================

/**
 * EXAMPLE 1: Basic usage in App.js
 * 
 * import ErrorBoundary from './src/components/ErrorBoundary';
 * 
 * export default function App() {
 *   return (
 *     <ErrorBoundary>
 *       <AuthProvider>
 *         <NavigationContainer>
 *           <AppNavigator />
 *         </NavigationContainer>
 *       </AuthProvider>
 *     </ErrorBoundary>
 *   );
 * }
 */

/**
 * EXAMPLE 2: With custom fallback component
 * 
 * function CustomErrorScreen({ error, onReset }) {
 *   return (
 *     <View>
 *       <Text>Custom Error UI</Text>
 *       <Text>{error.message}</Text>
 *       <Button title="Restart" onPress={onReset} />
 *     </View>
 *   );
 * }
 * 
 * <ErrorBoundary fallbackComponent={CustomErrorScreen}>
 *   <App />
 * </ErrorBoundary>
 */

/**
 * EXAMPLE 3: With fallback render function
 * 
 * <ErrorBoundary
 *   fallback={({ error, onReset }) => (
 *     <SafeAreaView>
 *       <Text>Error: {error.message}</Text>
 *       <Button title="Try again" onPress={onReset} />
 *     </SafeAreaView>
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 */

/**
 * EXAMPLE 4: With onReset callback
 * 
 * <ErrorBoundary
 *   onReset={() => {
 *     // Clear state, refetch data, etc.
 *     console.log('Resetting app state');
 *   }}
 * >
 *   <App />
 * </ErrorBoundary>
 */

/**
 * EXAMPLE 5: Multiple boundaries for different sections
 * 
 * <ErrorBoundary>
 *   <Header />
 * </ErrorBoundary>
 * 
 * <ErrorBoundary>
 *   <MainContent />
 * </ErrorBoundary>
 * 
 * <ErrorBoundary>
 *   <Footer />
 * </ErrorBoundary>
 */
