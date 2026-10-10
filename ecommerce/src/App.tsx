import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import ProductList from "./components/ProductList";
import SignupPage from "./pages/SignupPage";
import SigninPage from "./pages/SigninPage";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import { useAuthStore } from "./store/authStore";
import SessionTimer from "./components/SessionTimer";

function App() {
    const [path, setPath] = useState(window.location.pathname);
    const restoreSession = useAuthStore((state) => state.restoreSession);
    const isLoading = useAuthStore((state) => state.isLoading);

    // On app start, validate the session with the server
    useEffect(() => {
        restoreSession();
    }, [restoreSession]);

    useEffect(() => {
        const handlePopState = () => setPath(window.location.pathname);
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    const setPage = (page: string) => {
        const newPath = page === "admin" ? "/admin" : "/user";
        window.history.pushState({}, "", newPath);
        setPath(newPath);
    };

    const renderPage = () => {
        if (path === "/signup") return <SignupPage />;
        if (path === "/signin") return <SigninPage setPage={setPage} />;
        if (path === "/admin") return <AdminDashboard />;
        if (path === "/user") return <UserDashboard />;
        return <ProductList />;
    };

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="container" style={{ textAlign: "center", padding: "2rem" }}>
                    <p>Loading...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="container">{renderPage()}</div>
            <SessionTimer />
        </>
    );
}
export default App;
