import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";
import {
  joinTenantRoom,
  joinUserRoom,
  leaveTenantRoom,
  leaveUserRoom
} from "./socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem("apthive_auth");
    return raw ? JSON.parse(raw) : { token: "", user: null };
  });
  const [membership, setMembership] = useState(null);
  const [isMembershipLoading, setIsMembershipLoading] = useState(false);

  const persistAuth = useCallback((next) => {
    setAuth(next);
    localStorage.setItem("apthive_auth", JSON.stringify(next));
  }, []);

  const clearAuth = useCallback(() => {
    setAuth({ token: "", user: null });
    setMembership(null);
    localStorage.removeItem("apthive_auth");
  }, []);

  const refreshMembership = useCallback(
    async (tokenOverride) => {
      const effectiveToken = tokenOverride || auth.token;
      if (!effectiveToken) {
        setMembership(null);
        return null;
      }

      setIsMembershipLoading(true);
      try {
        const data = await apiRequest("/membership/me", { token: effectiveToken });
        setMembership(data.item || null);
        return data.item || null;
      } catch (_error) {
        setMembership(null);
        return null;
      } finally {
        setIsMembershipLoading(false);
      }
    },
    [auth.token]
  );

  async function login(payload) {
    const data = await apiRequest("/auth/login", { method: "POST", body: payload });
    const next = { token: data.token, user: data.user };
    persistAuth(next);
    await refreshMembership(next.token);
  }

  async function register(payload) {
    const data = await apiRequest("/auth/register", { method: "POST", body: payload });

    if (data?.token && data?.user) {
      const next = { token: data.token, user: data.user };
      persistAuth(next);
      await refreshMembership(next.token);
    }

    return data;
  }

  async function verifyRegistration(payload) {
    const data = await apiRequest("/auth/verify-registration", { method: "POST", body: payload });
    if (data?.token && data?.user) {
      const next = { token: data.token, user: data.user };
      persistAuth(next);
      await refreshMembership(next.token);
    }
    return data;
  }

  async function resendRegistrationOtp(payload) {
    return apiRequest("/auth/resend-registration-otp", { method: "POST", body: payload });
  }

  function logout() {
    clearAuth();
  }

  useEffect(() => {
    if (!auth.token || !auth.user) {
      return;
    }

    joinUserRoom(auth.user.id || auth.user._id);
    joinTenantRoom(auth.user.tenantId);

    return () => {
      leaveUserRoom(auth.user.id || auth.user._id);
      leaveTenantRoom(auth.user.tenantId);
    };
  }, [auth.token, auth.user]);

  useEffect(() => {
    if (auth.token) {
      refreshMembership(auth.token);
    }
  }, [auth.token, refreshMembership]);

  const membershipStatus = membership?.status || null;
  const isMembershipApproved = membershipStatus === "approved";

  const value = useMemo(
    () => ({
      token: auth.token,
      user: auth.user,
      isLoggedIn: Boolean(auth.token),
      membership,
      membershipStatus,
      isMembershipApproved,
      isMembershipLoading,
      login,
      register,
      verifyRegistration,
      resendRegistrationOtp,
      refreshMembership,
      logout
    }),
    [
      auth,
      isMembershipApproved,
      isMembershipLoading,
      membership,
      membershipStatus,
      refreshMembership
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
