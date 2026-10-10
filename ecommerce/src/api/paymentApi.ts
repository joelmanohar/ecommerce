import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api`;

export interface PaymentResponse {
    keyId: string;
    orderId: number;
    razorpayOrderId: string;
    amount: number;
    currency: string;
}

export interface CodResponse {
    orderId: number;
    message: string;
    status: string;
}

// Session-based auth: send cookies automatically with withCredentials
const sessionConfig = () => ({
    withCredentials: true
});

export const createOrder = async (
    items: { productId: number; quantity: number }[]
): Promise<{ orderId: number }> => {
    const response = await axios.post(`${API_URL}/orders`, { items }, sessionConfig());
    return response.data;
};

export const createPayment = async (orderId: number): Promise<PaymentResponse> => {
    const response = await axios.post(`${API_URL}/payment/create/${orderId}`, {}, sessionConfig());
    return response.data;
};

export const verifyPayment = async (data: {
    orderId: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}): Promise<void> => {
    await axios.post(`${API_URL}/payment/verify`, data, sessionConfig());
};

export const placeCodOrder = async (orderId: number): Promise<CodResponse> => {
    const response = await axios.post(`${API_URL}/payment/cod/${orderId}`, {}, sessionConfig());
    return response.data;
};
