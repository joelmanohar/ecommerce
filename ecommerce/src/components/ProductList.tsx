import { useEffect, useState } from "react";
import { getProducts } from "../api/productApi";
import type { Product } from "../types/product";
import ProductCard from "./ProductCard";

interface ProductListProps {
    isAdmin?: boolean;
}

function ProductList({ isAdmin = false }: ProductListProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            setError("Unable to load products");
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        "All",
        ...new Set(products.map((product) => product.category))
    ];

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.productName
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesCategory = category === "All" || product.category === category;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return <p>Loading products...</p>;
    }
    if (error) {
        return <p className="error-message">{error}</p>;
    }

    return (
        <div>
            <div className="filters">
                <input
                    type="text"
                    placeholder="Search products"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
                <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                >
                    {categories.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>
            <div className="product-grid">
                {filteredProducts.map((product) => (
                    <ProductCard key={product.productId} product={product} isAdmin={isAdmin} />
                ))}
            </div>
        </div>
    );
}
export default ProductList;
