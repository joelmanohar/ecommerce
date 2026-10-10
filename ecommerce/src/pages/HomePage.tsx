import { useNavigate } from "react-router-dom";
import ProductList from "../components/ProductList";
import { useCartStore } from "../store/cartStore";

function HomePage() {
    const navigate = useNavigate();
    const cartItems = useCartStore((state) => state.cartItems);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="container">
            <div className="header-bar">
                <div>
                    <h1>E-Commerce Product Management System</h1>
                    <p className="subtitle">Browse Products</p>
                </div>
                <button className="cart-nav-btn" onClick={() => navigate("/cart")}>
                    🛒 Cart {itemCount > 0 && `(${itemCount})`}
                </button>
            </div>
            <ProductList />
        </div>
    );
}
export default HomePage;