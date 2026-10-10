import { useState } from "react";
import { signin } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

interface SigninPageProps {
    setPage: (page: string) => void;
}

function SigninPage({ setPage }: SigninPageProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const user = useAuthStore((state) => state.user);
    const login = useAuthStore((state) => state.login);
    const logout = useAuthStore((state) => state.logout);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const authUser = await signin({ email, password });
            login(authUser);
            if (authUser.role === "ADMIN") {
                setPage("admin");
            } else {
                setPage("user");
            }
        } catch {
            setError("Invalid Email or Password");
        } finally {
            setIsLoading(false);
        }
    };

    if (user) {
        return (
            <div className="auth-container">
                <h2>Active Session</h2>
                <p style={{ margin: "1rem 0", color: "#4a5568" }}>
                    You are already signed in as <strong>{user.name}</strong> ({user.email}) [Role: <strong>{user.role}</strong>].
                </p>
                <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                    <button
                        type="button"
                        onClick={() => setPage(user.role === "ADMIN" ? "admin" : "user")}
                    >
                        Go to Dashboard
                    </button>
                    <button
                        type="button"
                        style={{ backgroundColor: "#e53e3e" }}
                        onClick={async () => await logout()}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <h2>Sign In</h2>
            <p style={{ fontSize: "0.85rem", color: "#718096", marginBottom: "1rem" }}>
                Session-based Authentication
            </p>
            <form onSubmit={handleSubmit}>
                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />
                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                </button>
            </form>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
}
export default SigninPage;