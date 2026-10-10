import { create } from "zustand";
import type { AuthResponse } from "../types/auth";
import { checkSession, logout as apiLogout } from "../api/authApi";

interface AuthStore {
    user: AuthResponse | null;
    isLoading: boolean;
    sessionStartTime: number | null;
    login: (user: AuthResponse) => void;
    logout: () => Promise<void>;
    restoreSession: () => Promise<void>;
    resetSessionTimer: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    isLoading: true,
    sessionStartTime: null,

    login: (user) => {
        const now = Date.now();
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("sessionStartTime", String(now));
        set({ user: user, sessionStartTime: now });
    },

    logout: async () => {
        try {
            await apiLogout();
        } catch {
            // Server session invalidate
        }
        localStorage.removeItem("user");
        localStorage.removeItem("sessionStartTime");
        set({ user: null, sessionStartTime: null });
    },

    resetSessionTimer: () => {
        const now = Date.now();
        localStorage.setItem("sessionStartTime", String(now));
        set({ sessionStartTime: now });
    },

    restoreSession: async () => {
        set({ isLoading: true });
        try {
            const sessionUser = await checkSession();
            if (sessionUser) {
                const savedTime = localStorage.getItem("sessionStartTime");
                const now = Date.now();
                let startTime = savedTime ? Number(savedTime) : now;
                // If saved time has already exceeded 120s (2 mins), start fresh or clear
                if (now - startTime >= 120000) {
                    startTime = now;
                }
                localStorage.setItem("user", JSON.stringify(sessionUser));
                localStorage.setItem("sessionStartTime", String(startTime));
                set({ user: sessionUser, sessionStartTime: startTime, isLoading: false });
            } else {
                localStorage.removeItem("user");
                localStorage.removeItem("sessionStartTime");
                set({ user: null, sessionStartTime: null, isLoading: false });
            }
        } catch {
            localStorage.removeItem("user");
            localStorage.removeItem("sessionStartTime");
            set({ user: null, sessionStartTime: null, isLoading: false });
        }
    },
}));
