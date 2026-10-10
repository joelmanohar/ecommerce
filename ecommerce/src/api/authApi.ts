import axios from "axios";
import type { SignupRequest, SigninRequest, AuthResponse } from "../types/auth";

const API_URL = "http://localhost:8080/api/auth";

// Configure axios to send cookies with every request (for session-based auth)
const authAxios = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export const signup = async (data: SignupRequest): Promise<string> => {
    const response = await authAxios.post<string>("/signup", data);
    return response.data;
};

export const signin = async (data: SigninRequest): Promise<AuthResponse> => {
    const response = await authAxios.post<AuthResponse>("/signin", data);
    return response.data;
};

/**
 * Check if the user has an active session on the server.
 * Returns the user info if session is valid, or null if not.
 */
export const checkSession = async (): Promise<AuthResponse | null> => {
    try {
        const response = await authAxios.get<AuthResponse>("/me");
        return response.data;
    } catch {
        return null;
    }
};

/**
 * Logout by invalidating the session on the server.
 */
export const logout = async (): Promise<void> => {
    await authAxios.post("/logout");
};