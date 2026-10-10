import axios from "axios";
import type { Product } from "../types/product";

const API_URL = "http://localhost:8080/api/products";

// Session-based auth: send cookies automatically with withCredentials
const sessionConfig = () => ({
    withCredentials: true
});

export const getProducts = async (): Promise<Product[]> => {
    const response = await axios.get<Product[]>(API_URL);
    return response.data;
};

export const addProduct = async (
    product: Omit<Product, "productId">
): Promise<Product> => {
    const response = await axios.post<Product>(API_URL, product, sessionConfig());
    return response.data;
};

export const updateProduct = async (
    productId: number,
    product: Omit<Product, "productId">
): Promise<Product> => {
    const response = await axios.put<Product>(`${API_URL}/${productId}`, product, sessionConfig());
    return response.data;
};

export const deleteProduct = async (productId: number): Promise<void> => {
    await axios.delete(`${API_URL}/${productId}`, sessionConfig());
};
