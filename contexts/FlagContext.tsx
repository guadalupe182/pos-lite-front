'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { decodeJwt } from 'jose';

interface FlagContextType {
    flags: string[];
    hasFlag: (flag: string) => boolean;
}

const FlagContext = createContext<FlagContextType>({
    flags: [],
    hasFlag: () => false,
});

export const FlagProvider = ({ children }: { children: React.ReactNode }) => {
    const [flags, setFlags] = useState<string[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        try {
            const payload = decodeJwt(token);
            const extractedFlags = (payload.features as string[]) || [];

            // queueMicrotask evita el renderizado síncrono en cascada
            queueMicrotask(() => {
                setFlags(extractedFlags);
            });
        } catch {
            queueMicrotask(() => {
                setFlags([]);
            });
        }
    }, []);

    const hasFlag = (flag: string) => flags.includes(flag);

    return (
        <FlagContext.Provider value={{ flags, hasFlag }}>
            {children}
        </FlagContext.Provider>
    );
};

// Tu Hook personalizado para consumir las banderas en cualquier lado:
export const useFlags = () => useContext(FlagContext);