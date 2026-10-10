import { useNavigate } from "react-router-dom";
import Cart from "../components/Cart";
import { useCartStore } from "../store/cartStore";

function CartPage() {
    const navigate = useNavigate();
    const cartItems = useCartStore((state) => state.cartItems);

    return (
        <div className="container">
            <button className="back-btn" onClick={() => navigate("/")}>
                ← Back to Shopping
            </button>
            <Cart />
            {cartItems.length > 0 && (
                <button
                    className="checkout-nav-btn"
                    onClick={() => navigate("/checkout")}
                >
                    Proceed to Checkout →
                </button>
            )}
        </div>
    );
}
export default CartPage;