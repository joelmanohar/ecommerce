import { useNavigate } from "react-router-dom";
import CheckoutForm from "../components/CheckoutForm";

function CheckoutPage() {
    const navigate = useNavigate();

    return (
        <div className="container">
            <button className="back-btn" onClick={() => navigate("/cart")}>
                ← Back to Cart
            </button>
            <CheckoutForm onSuccess={() => navigate("/")} />
        </div>
    );
}
export default CheckoutPage;