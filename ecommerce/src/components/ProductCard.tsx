import { useState } from "react";
import type { Product } from "../types/product";
import { useCartStore } from "../store/cartStore";
import { deleteProduct, updateProduct } from "../api/productApi";

interface ProductCardProps {
    product: Product;
    isAdmin?: boolean;
}

function ProductCard({ product, isAdmin = false }: ProductCardProps) {
    const cartItems = useCartStore((state) => state.cartItems);
    const addToCart = useCartStore((state) => state.addToCart);
    const increaseQuantity = useCartStore((state) => state.increaseQuantity);
    const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);

    const cartItem = cartItems.find(
        (item) => item.product.productId === product.productId
    );
    const quantityInCart = cartItem ? cartItem.quantity : 0;
    const remainingStock = product.stock - quantityInCart;
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<Omit<Product, "productId">>({
        productName: product.productName,
        category: product.category,
        description: product.description,
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl,
        rating: product.rating,
        status: product.status
    });
    const [message, setMessage] = useState("");

    const handleDelete = async () => {
        if (!window.confirm(`Delete ${product.productName}?`)) return;
        try {
            await deleteProduct(product.productId);
            window.location.reload();
        } catch {
            setMessage("Product deletion failed");
        }
    };

    const handleUpdate = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await updateProduct(product.productId, {
                ...draft,
                status: draft.stock > 0 ? "AVAILABLE" : "OUT_OF_STOCK"
            });
            window.location.reload();
        } catch {
            setMessage("Product update failed");
        }
    };

    const updateDraft = (name: keyof Omit<Product, "productId">, value: string) => {
        setDraft((current) => ({
            ...current,
            [name]: ["price", "stock", "rating"].includes(name) ? Number(value) : value
        }));
    };

    if (editing) {
        return (
            <div className="product-card">
                <form className="product-form" onSubmit={handleUpdate}>
                    <h3>Update Product</h3>
                    <input value={draft.productName} onChange={(e) => updateDraft("productName", e.target.value)} placeholder="Product Name" required />
                    <input value={draft.category} onChange={(e) => updateDraft("category", e.target.value)} placeholder="Category" required />
                    <textarea value={draft.description} onChange={(e) => updateDraft("description", e.target.value)} placeholder="Description" required />
                    <input type="number" value={draft.price} onChange={(e) => updateDraft("price", e.target.value)} placeholder="Price" required />
                    <input type="number" value={draft.stock} onChange={(e) => updateDraft("stock", e.target.value)} placeholder="Stock" required />
                    <input value={draft.imageUrl} onChange={(e) => updateDraft("imageUrl", e.target.value)} placeholder="Image URL" required />
                    <input type="number" step="0.1" value={draft.rating} onChange={(e) => updateDraft("rating", e.target.value)} placeholder="Rating" required />
                    <button type="submit">Save Changes</button>
                    <button type="button" onClick={() => setEditing(false)}>Cancel</button>
                    {message && <p className="form-message">{message}</p>}
                </form>
            </div>
        );
    }

    return (
        <div className="product-card">
            <img src={product.imageUrl} alt={product.productName} />
            <h3>{product.productName}</h3>
            <p>Category: {product.category}</p>
            <p>₹{product.price}</p>
            <p>Rating: ⭐ {product.rating}</p>
            <p>
                {remainingStock <= 0
                    ? "Out of Stock"
                    : remainingStock <= 3
                    ? `Limited Stock (${remainingStock})`
                    : `In Stock (${remainingStock})`}
            </p>

            {!isAdmin && (quantityInCart === 0 ? (
                <button
                    className="add-to-cart-btn"
                    onClick={() => addToCart(product)}
                    disabled={remainingStock <= 0}
                >
                    {remainingStock > 0 ? "🛒 Add to Cart" : "Out of Stock"}
                </button>
            ) : (
                <div className="qty-selector">
                    <button
                        className="qty-btn"
                        onClick={() => decreaseQuantity(product.productId)}
                    >
                        -
                    </button>
                    <span className="qty-count">{quantityInCart}</span>
                    <button
                        className="qty-btn"
                        onClick={() => increaseQuantity(product.productId)}
                        disabled={remainingStock <= 0}
                    >
                        +
                    </button>
                </div>
            ))}
            {isAdmin && (
                <div className="admin-product-buttons">
                    <button onClick={() => setEditing(true)}>Update</button>
                    <button onClick={handleDelete}>Delete</button>
                </div>
            )}
            {message && <p className="error-message">{message}</p>}
        </div>
    );
}
export default ProductCard;
