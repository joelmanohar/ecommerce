import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutFormData } from "../schemas/checkoutSchema";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { createOrder, createPayment, verifyPayment, placeCodOrder } from "../api/paymentApi";

interface RazorpaySuccessResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill: { name: string; email: string; contact: string };
    notes: { address: string };
    handler: (response: RazorpaySuccessResponse) => void;
    modal: { ondismiss: () => void };
}

declare global {
    interface Window {
        Razorpay?: new (options: RazorpayOptions) => {
            open: () => void;
            on: (event: "payment.failed", handler: () => void) => void;
        };
    }
}

type PaymentMode = "RAZORPAY" | "COD";

interface CheckoutFormProps {
    onSuccess?: () => void;
}

function CheckoutForm({ onSuccess }: CheckoutFormProps) {
    const cartItems = useCartStore((state) => state.cartItems);
    const clearCart = useCartStore((state) => state.clearCart);
    const total = useCartStore((state) => state.getTotal());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(null);
    const [message, setMessage] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<CheckoutFormData>({ resolver: zodResolver(checkoutSchema) });

    const user = useAuthStore((state) => state.user);

    // Guard: validate form fields and basic conditions
    const validate = (): boolean => {
        if (cartItems.length === 0) { setMessage("Your cart is empty."); return false; }
        if (!user) { setMessage("Please sign in before checking out."); return false; }
        return true;
    };

    // ── Razorpay online payment ────────────────────────────────────────────
    const onPayOnline = async (data: CheckoutFormData) => {
        if (!validate()) return;
        if (!window.Razorpay) {
            setMessage("Razorpay did not load. Refresh the page and try again.");
            return;
        }
        setPaymentMode("RAZORPAY");
        setMessage("");
        setIsSubmitting(true);
        try {
            const order = await createOrder(
                cartItems.map(({ product, quantity }) => ({ productId: product.productId, quantity }))
            );
            const payment = await createPayment(order.orderId);

            const checkout = new window.Razorpay({
                key: payment.keyId,
                amount: payment.amount,
                currency: payment.currency,
                name: "SmartCart",
                description: "E-Commerce Order",
                order_id: payment.razorpayOrderId,
                prefill: { name: data.name, email: user?.email || data.email || "", contact: data.phone },
                notes: { address: data.address },
                handler: async (response) => {
                    try {
                        await verifyPayment({
                            orderId: order.orderId,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        });
                        clearCart();
                        reset();
                        setMessage(`✅ Payment successful! Order #${order.orderId} confirmed.`);
                        onSuccess?.();
                    } catch {
                        setMessage("⚠️ Payment verification failed. Contact support.");
                    }
                },
                modal: {
                    ondismiss: () => setMessage("Payment cancelled. Your order is still pending.")
                }
            });
            checkout.on("payment.failed", () => setMessage("Payment failed. Your order is still pending."));
            checkout.open();
        } catch (err: unknown) {
            console.error("Razorpay error:", err);
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            setMessage(axiosErr?.response?.data?.message ?? axiosErr?.message ?? "Unable to start payment. Try again.");
        } finally {
            setIsSubmitting(false);
            setPaymentMode(null);
        }
    };

    // ── Cash on Delivery ───────────────────────────────────────────────────
    const onCod = async (data: CheckoutFormData) => {
        if (!validate()) return;
        setPaymentMode("COD");
        setMessage("");
        setIsSubmitting(true);
        try {
            const order = await createOrder(
                cartItems.map(({ product, quantity }) => ({ productId: product.productId, quantity }))
            );
            await placeCodOrder(order.orderId);
            clearCart();
            reset();
            setMessage(`✅ Order #${order.orderId} placed! Pay ₹${total} on delivery.`);
            onSuccess?.();
        } catch (err: unknown) {
            console.error("COD error:", err);
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            setMessage(axiosErr?.response?.data?.message ?? axiosErr?.message ?? "Unable to place order. Try again.");
        } finally {
            setIsSubmitting(false);
            setPaymentMode(null);
        }
        // Suppress unused-variable warning for data — address is captured in order
        void data;
    };

    const isDisabled = isSubmitting || cartItems.length === 0;

    return (
        <div className="checkout">
            <h2>Checkout</h2>
            <form>
                <div>
                    <label>Name</label>
                    <input type="text" {...register("name")} />
                    {errors.name && <p className="error-message">{errors.name.message}</p>}
                </div>
                <div>
                    <label>Phone</label>
                    <input type="tel" {...register("phone")} />
                    {errors.phone && <p className="error-message">{errors.phone.message}</p>}
                </div>
                <div>
                    <label>Address</label>
                    <textarea {...register("address")} />
                    {errors.address && <p className="error-message">{errors.address.message}</p>}
                </div>

                <h3>Order Total: ₹{total}</h3>

                {/* Two payment buttons side by side */}
                <div className="payment-buttons">
                    <button
                        type="button"
                        className="btn-razorpay"
                        disabled={isDisabled}
                        onClick={handleSubmit(onPayOnline)}
                    >
                        {isSubmitting && paymentMode === "RAZORPAY"
                            ? "Opening payment…"
                            : "💳 Pay Online"}
                    </button>

                    <button
                        type="button"
                        className="btn-cod"
                        disabled={isDisabled}
                        onClick={handleSubmit(onCod)}
                    >
                        {isSubmitting && paymentMode === "COD"
                            ? "Placing order…"
                            : "💵 Cash on Delivery"}
                    </button>
                </div>

                {message && <p role="status" className="form-message">{message}</p>}
            </form>
        </div>
    );
}

export default CheckoutForm;
