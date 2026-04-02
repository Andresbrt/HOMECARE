/**
 * PaymentBricksScreen — Checkout Bricks de MercadoPago embebido en WebView
 *
 * Flujo:
 *  1. Recibe { servicioId, monto, preferenceId (opcional) } via navigation.params
 *  2. Renderiza el SDK de Bricks en un WebView con HTML inline
 *  3. Cuando el usuario completa el formulario, onSubmit devuelve formData con
 *     el cardToken al RN app mediante postMessage
 *  4. La app llama POST /payments/create con el cardToken → el backend resuelve
 *     el cobro con la API de MercadoPago y devuelve el estado
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

import { MP_PUBLIC_KEY } from '../../config/api';
import apiClient from '../../services/apiClient';
import { COLORS } from '../../constants/theme';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildBricksHtml(publicKey, amount, preferenceId) {
  const prefInit = preferenceId ? `preferenceId: '${preferenceId}',` : '';
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <title>Pago Seguro</title>
  <script src="https://sdk.mercadopago.com/js/v2"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #121212;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 0 12px 24px;
    }
    #paymentBrick_container { margin-top: 8px; }
    #status-msg {
      display: none;
      text-align: center;
      padding: 24px 16px;
      color: #fff;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div id="paymentBrick_container"></div>
  <div id="status-msg"></div>

  <script>
    (function () {
      var mp = new MercadoPago('${publicKey}', { locale: 'es-CO' });

      var settings = {
        initialization: {
          amount: ${amount},
          ${prefInit}
        },
        customization: {
          paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
          },
          visual: {
            style: { theme: 'dark' },
          },
        },
        callbacks: {
          onReady: function () {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'ready' })
            );
          },
          onSubmit: function (data) {
            return new Promise(function (resolve) {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'submit', formData: data.formData })
              );
              resolve();
            });
          },
          onError: function (error) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'error', message: error.message || JSON.stringify(error) })
            );
          },
        },
      };

      mp.bricks().create('payment', 'paymentBrick_container', settings);
    })();
  </script>
</body>
</html>
  `.trim();
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PaymentBricksScreen({ route, navigation }) {
  const { servicioId, monto, preferenceId } = route.params || {};

  const [webviewReady, setWebviewReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const webviewRef = useRef(null);

  // HTML is generated once (monto must be a number, not a BigDecimal string with trailing zeroes)
  const htmlContent = buildBricksHtml(
    MP_PUBLIC_KEY,
    parseFloat(monto) || 0,
    preferenceId || null
  );

  const handleMessage = useCallback(
    async (event) => {
      let msg;
      try {
        msg = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      if (msg.type === 'ready') {
        setWebviewReady(true);
        return;
      }

      if (msg.type === 'error') {
        Alert.alert('Error en el formulario', msg.message || 'Verifica los datos e intenta de nuevo.');
        return;
      }

      if (msg.type === 'submit') {
        if (processing) return;
        setProcessing(true);

        const fd = msg.formData || {};
        try {
          const res = await apiClient.post('/payments/create', {
            servicioId,
            monto,
            metodoPago: 'CARD',
            cardToken: fd.token,
            paymentMethodId: fd.payment_method_id,
            installments: fd.installments ?? 1,
            issuerId: fd.issuer_id ? String(fd.issuer_id) : undefined,
            email: fd.payer?.email,
          });

          const pago = res.data;
          if (pago.estado === 'APROBADO') {
            Alert.alert(
              '¡Pago aprobado! ✓',
              `Tu pago de $${parseFloat(monto).toLocaleString('es-CO')} fue procesado exitosamente.`,
              [{ text: 'Continuar', onPress: () => navigation.popToTop() }]
            );
          } else if (pago.estado === 'PROCESANDO') {
            Alert.alert(
              'Pago en proceso',
              'Tu pago está siendo procesado. Te notificaremos cuando sea confirmado.',
              [{ text: 'Entendido', onPress: () => navigation.goBack() }]
            );
          } else {
            Alert.alert(
              'Pago no aprobado',
              'Tu pago no pudo ser procesado. Verifica los datos de tu tarjeta e intenta de nuevo.'
            );
          }
        } catch (err) {
          const errMsg =
            err.response?.data?.message ||
            err.response?.data?.error ||
            'No se pudo procesar el pago. Intenta de nuevo.';
          Alert.alert('Error al procesar pago', errMsg);
        } finally {
          setProcessing(false);
        }
      }
    },
    [servicioId, monto, processing, navigation]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => !processing && navigation.goBack()}
          disabled={processing}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pago Seguro</Text>
        <View style={styles.mpBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#00b1ea" />
          <Text style={styles.mpBadgeText}>MercadoPago</Text>
        </View>
      </View>

      {/* Amount banner */}
      <View style={styles.amountBanner}>
        <Text style={styles.amountLabel}>Total a pagar</Text>
        <Text style={styles.amountValue}>
          ${parseFloat(monto).toLocaleString('es-CO')} COP
        </Text>
      </View>

      {/* WebView */}
      <View style={styles.webviewWrapper}>
        {!webviewReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>Cargando formulario de pago…</Text>
          </View>
        )}

        <WebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent, baseUrl: 'https://sdk.mercadopago.com' }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          startInLoadingState={false}
          style={[styles.webview, !webviewReady && styles.hidden]}
        />
      </View>

      {/* Processing overlay */}
      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.processingText}>Procesando pago…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  mpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1c2b3a',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mpBadgeText: {
    color: '#00b1ea',
    fontSize: 11,
    fontWeight: '600',
  },
  amountBanner: {
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  amountLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 2,
  },
  amountValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  webviewWrapper: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#121212',
  },
  hidden: {
    opacity: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    zIndex: 10,
  },
  loadingText: {
    color: '#aaa',
    marginTop: 12,
    fontSize: 14,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  processingText: {
    color: '#fff',
    marginTop: 14,
    fontSize: 16,
    fontWeight: '600',
  },
});
