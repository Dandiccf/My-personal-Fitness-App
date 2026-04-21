import type { AuthUser } from "../types";
import { apiFetch } from "./api";

const TOKEN_KEY = "fitness_auth_token";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function registerWithPassword(email: string, password: string) {
  return apiFetch<AuthResponse>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    { auth: false },
  );
}

export async function loginWithPassword(email: string, password: string) {
  return apiFetch<AuthResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    { auth: false },
  );
}

export async function fetchCurrentUser() {
  return apiFetch<{ user: AuthUser }>("/auth/me");
}
