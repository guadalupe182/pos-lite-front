'use client';

import React, { createContext, useContext, useState } from 'react';

export interface User {
    sub?: string;
    name?: string;
    email?: string;
    username?: string;
    features?: string[];
    authorities?: string[];
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser: () => {},
    logout: () => {},
});

// Función auxiliar para decodificar JWT de forma segura
const decodeToken = (token: string): User | null => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error al decodificar access_token:', error);
        return null;
    }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        if (typeof window === 'undefined') return null;

        // 1. Prioridad: intentar leer usuario explícito en 'pos_user'
        const storedUser = localStorage.getItem('pos_user');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch (error) {
                console.error('Error al parsear el usuario almacenado:', error);
            }
        }

        // 2. Fallback: decodificar automáticamente si existe 'access_token'
        const token = localStorage.getItem('access_token');
        if (token) {
            return decodeToken(token);
        }

        return null;
    });

    const handleSetUser = (userData: User | null) => {
        setUser(userData);
        if (userData) {
            localStorage.setItem('pos_user', JSON.stringify(userData));
        } else {
            localStorage.removeItem('pos_user');
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('pos_user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('jwt_token');
    };

    return (
        <AuthContext.Provider value={{ user, setUser: handleSetUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);