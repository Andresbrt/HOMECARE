import { useState, useEffect, useRef, useCallback } from 'react';
import { authService } from '../services/authService';

const OTP_EXPIRY_SECONDS = 600; // 10 min
const RESEND_COOLDOWN = 60;     // 1 min
const MAX_ATTEMPTS = 3;

export function useOTPVerification(email) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [expirySeconds, setExpirySeconds] = useState(OTP_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);

  const expiryRef = useRef(null);
  const resendRef = useRef(null);

  // Cuenta regresiva de expiración (10 min)
  useEffect(() => {
    expiryRef.current = setInterval(() => {
      setExpirySeconds((s) => {
        if (s <= 1) {
          clearInterval(expiryRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(expiryRef.current);
  }, []);

  // Cooldown para reenvío (60 s)
  useEffect(() => {
    resendRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(resendRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(resendRef.current);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const verify = useCallback(async () => {
    if (code.length !== 4) {
      setError('Ingresa los 4 dígitos');
      return null;
    }
    if (expirySeconds === 0) {
      setError('El código expiró. Solicita uno nuevo.');
      return null;
    }
    if (blocked) {
      setError('Cuenta bloqueada temporalmente. Solicita un nuevo código.');
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await authService.verifyOTP(email, code);
      // No activamos success aquí — la pantalla lo hace DESPUÉS de loginWithOTPResponse
      // para que la animación de éxito ocurra simultáneamente con la redirección
      return response;
    } catch (err) {
      const msg = err.response?.data?.message ||
                  err.response?.data?.mensaje ||
                  err.message || 'Código incorrecto';
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setBlocked(true);
        setError('Demasiados intentos. Solicita un nuevo código.');
      } else {
        setError(msg);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [code, email, expirySeconds, blocked, attempts]);

  const resend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setError(null);
    try {
      await authService.sendOTP(email);
      setCode('');
      setAttempts(0);
      setBlocked(false);
      setExpirySeconds(OTP_EXPIRY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN);
      // Reiniciar cooldown timer
      resendRef.current = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) { clearInterval(resendRef.current); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al reenviar el código');
    } finally {
      setResending(false);
    }
  }, [email, resendCooldown]);

  return {
    code, setCode,
    loading, resending,
    error, success, setSuccess,
    expirySeconds, expiryFormatted: formatTime(expirySeconds),
    resendCooldown, resendFormatted: formatTime(resendCooldown),
    canResend: resendCooldown === 0 && !resending,
    expired: expirySeconds === 0,
    blocked,
    verify,
    resend,
  };
}
