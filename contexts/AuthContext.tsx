'use client';

import React, { createContext, useContext, useState } from 'react';

interface User {
    email: string;
    username?: string,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Inicialización perezosa: lee localStorage una sola vez al montar sin reactivar renderizados
    const [user, setUser] = useState<User | null>(() => {
        if (typeof window === 'undefined') return null;
        const storedUser = localStorage.getItem('pos_user');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch (error) {
                console.error('Error al parsear el usuario almacenado', error);
            }
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
        handleSetUser(null);
        localStorage.removeItem('jwt_token');
    };

    return (
        <AuthContext.Provider value={{ user, setUser: handleSetUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);