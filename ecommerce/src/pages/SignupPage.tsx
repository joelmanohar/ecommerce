import { useState, type FormEvent } from "react";
import { signup } from "../api/authApi";

function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const response = await signup({ name, email, password, role: "USER" });
            setMessage(response);
            setName("");
            setEmail("");
            setPassword("");
        } catch (error) {
            setMessage("Signup failed");
        }
    };

    return (
        <div className="auth-container">
            <h2>Signup</h2>
            <form onSubmit={handleSubmit}>
                <label>Name</label>
                <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
                <label>Email</label>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                <label>Password</label>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <button type="submit">Signup</button>
            </form>
            {message && <p className="form-message">{message}</p>}
        </div>
    );
}
export default SignupPage;
