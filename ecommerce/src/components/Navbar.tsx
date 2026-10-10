import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";

const TOTAL_SESSION_SECONDS = 600;  // 10 minutes session
const DISPLAY_THRESHOLD_SECONDS = 250;  // Show timer immediately after login

function NavbarTimer() {
    const user = useAuthStore((state) => state.user);
    const sessionStartTime = useAuthStore((state) => state.sessionStartTime);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

    useEffect(() => {
        if (!user || !sessionStartTime) {
            setRemainingSeconds(null);
            setElapsedSeconds(0);
            return;
        }
        const update = () => {
            const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
            setElapsedSeconds(elapsed);
            setRemainingSeconds(Math.max(0, TOTAL_SESSION_SECONDS - elapsed));
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [user, sessionStartTime]);

    if (!user || elapsedSeconds < DISPLAY_THRESHOLD_SECONDS || remainingSeconds === null || remainingSeconds <= 0) {
        return null;
    }

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    const isUrgent = remainingSeconds <= 30;

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "20px",
                backgroundColor: isUrgent ? "#fee2e2" : "rgba(59,130,246,0.15)",
                border: isUrgent ? "1.5px solid #f43f5e" : "1.5px solid #3b82f6",
                color: isUrgent ? "#be123c" : "#eff6ff",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.5px",
                whiteSpace: "nowrap",
                transition: "all 0.3s ease",
            }}
        >
            <span
                style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: isUrgent ? "#e11d48" : "#93c5fd",
                    boxShadow: isUrgent ? "0 0 6px #e11d48" : "0 0 5px #93c5fd",
                    animation: isUrgent ? "navPulse 1s infinite" : "none",
                    display: "inline-block",
                    flexShrink: 0,
                }}
            />
            ⏱ {formatted}
            <style>{`
                @keyframes navPulse {
                    0% { transform: scale(0.95); opacity: 0.7; }
                    50% { transform: scale(1.3); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.7; }
                }
            `}</style>
        </span>
    );
}

function Navbar() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const goTo = (path: string) => {
        window.history.pushState({}, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
    };

    const handleLogout = async () => {
        await logout();
        goTo("/");
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand" onClick={() => goTo("/")}>
                ECommerce
            </div>
            <div className="navbar-links">
                <button onClick={() => goTo("/")}>Products</button>
                {!user && (
                    <>
                        <button onClick={() => goTo("/signup")}>Signup</button>
                        <button onClick={() => goTo("/signin")}>Sign In</button>
                    </>
                )}
                {user && (
                    <>
                        <span className="welcome-user">
                            Welcome, {user.name} ({user.role})
                        </span>
                        {user.role === "ADMIN" && (
                            <button onClick={() => goTo("/admin")}>Admin Dashboard</button>
                        )}
                        {user.role === "USER" && (
                            <button onClick={() => goTo("/user")}>User Dashboard</button>
                        )}
                        <NavbarTimer />
                        <button onClick={handleLogout}>Logout</button>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
