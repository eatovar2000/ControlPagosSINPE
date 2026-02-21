/**
 * Authentication Context Provider for the app
 * Manages user state and provides auth functions
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  signInWithGoogle,
  signOut as firebaseSignOut,
  sendPhoneVerification,
  verifyPhoneCode,
  setupRecaptcha,
  getIdToken,
  subscribeToAuthChanges,
} from './firebase';
import { API_URL } from './theme';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Register or get user from our backend
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch(`${API_URL}/v1/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              display_name: firebaseUser.displayName,
              photo_url: firebaseUser.photoURL,
            }),
          });

          if (response.ok) {
            const userData = await response.json();
            setDbUser(userData);
          } else {
            console.error('Failed to register user:', await response.text());
          }
        } catch (err) {
          console.error('Error registering user:', err);
        }
      } else {
        setDbUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign in with Google
  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Error al iniciar sesion con Google');
      setLoading(false);
      throw err;
    }
  };

  // Phone auth state
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Send SMS code
  const sendSmsCode = async (phoneNumber) => {
    setError(null);
    try {
      setupRecaptcha('recaptcha-container');
      const result = await sendPhoneVerification(phoneNumber);
      setConfirmationResult(result);
      return result;
    } catch (err) {
      setError(err.message || 'Error al enviar codigo SMS');
      throw err;
    }
  };

  // Verify SMS code
  const verifySmsCode = async (code) => {
    setError(null);
    if (!confirmationResult) {
      throw new Error('No hay codigo pendiente de verificar');
    }
    try {
      await verifyPhoneCode(confirmationResult, code);
      setConfirmationResult(null);
    } catch (err) {
      setError(err.message || 'Codigo invalido');
      throw err;
    }
  };

  // Sign out
  const logout = async () => {
    setError(null);
    try {
      await firebaseSignOut();
      setUser(null);
      setDbUser(null);
    } catch (err) {
      setError(err.message || 'Error al cerrar sesion');
      throw err;
    }
  };

  // Get auth header for API calls
  const getAuthHeader = async () => {
    const token = await getIdToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  const value = {
    user,          // Firebase user
    dbUser,        // Our database user
    loading,
    error,
    isAuthenticated: !!user,
    loginWithGoogle,
    sendSmsCode,
    verifySmsCode,
    confirmationResult,
    logout,
    getAuthHeader,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
