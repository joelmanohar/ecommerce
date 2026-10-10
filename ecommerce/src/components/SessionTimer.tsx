import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/authStore";

const TOTAL_SESSION_SECONDS = 600;  // 10 minutes session
const INACTIVITY_SECONDS = 180;      // 3 minutes inactivity → home

function SessionTimer() {
    const user = useAuthStore((state) => state.user);
    const sessionStartTime = useAuthStore((state) => state.sessionStartTime);
    const logout = useAuthStore((state) => state.logout);

    const [showBanner, setShowBanner] = useState<"expired" | "inactive" | null>(null);

    const lastActivityRef = useRef<number>(Date.now());
    const loggedOutRef = useRef(false);

    // Reset inactivity timer on any user interaction
    useEffect(() => {
        if (!user) return;
        const resetActivity = () => {
            lastActivityRef.current = Date.now();
        };
        const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
        events.forEach((e) => window.addEventListener(e, resetActivity, { passive: true }));
        return () => events.forEach((e) => window.removeEventListener(e, resetActivity));
    }, [user]);

    // Session countdown + inactivity check
    useEffect(() => {
        if (!user || !sessionStartTime) {
            loggedOutRef.current = false;
            return;
        }

        loggedOutRef.current = false;
        lastActivityRef.current = Date.now();

        const redirectHome = async (reason: "expired" | "inactive") => {
            if (loggedOutRef.current) return;
            loggedOutRef.current = true;
            setShowBanner(reason);
            await logout();
            window.history.pushState({}, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate"));
            setTimeout(() => setShowBanner(null), 5000);
        };

        const tick = () => {
            const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
            const remaining = Math.max(0, TOTAL_SESSION_SECONDS - elapsed);

            // Session expired
            if (remaining <= 0) {
                redirectHome("expired");
                return;
            }

            // Inactivity check
            const inactiveSecs = Math.floor((Date.now() - lastActivityRef.current) / 1000);
            if (inactiveSecs >= INACTIVITY_SECONDS) {
                redirectHome("inactive");
            }
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [user, sessionStartTime, logout]);

    // Banner shown after session expires or inactivity logout
    if (showBanner) {
        const msg =
            showBanner === "expired"
                ? "⚠️ Session expired. Redirected to home."
                : "💤 Inactive. Redirected to home.";
        return (
            <div
                style={{
                    position: "fixed",
                    top: "70px",
                    right: "20px",
                    backgroundColor: "#fee2e2",
                    border: "1px solid #ef4444",
                    color: "#991b1b",
                    padding: "12px 18px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    zIndex: 10000,
                    fontSize: "14px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                {msg}
            </div>
        );
    }

    return null;
}

export default SessionTimer;
