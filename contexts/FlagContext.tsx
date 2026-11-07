'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { decodeJwt } from 'jose';

const LICENSE_FLAGS_STORAGE_KEY = 'gdev_license_flags';
const LICENSE_FLAGS_COOKIE_NAME = 'gdev_license_flags';

export type LicenseFlags = Record<string, string>;

function isExpired(expiration: string): boolean {
    const date = new Date(expiration);
    if (Number.isNaN(date.getTime())) return true;
    return date.getTime() <= Date.now();
}

function readCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1');
    const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

function writeLicenseFlags(flags: LicenseFlags, dispatchEvent: boolean): void {
    if (typeof window === 'undefined') return;
    const json = JSON.stringify(flags);
    try {
        window.localStorage.setItem(LICENSE_FLAGS_STORAGE_KEY, json);
    } catch {
        // Ignorar si el almacenamiento está bloqueado
    }
    try {
        document.cookie = `${LICENSE_FLAGS_COOKIE_NAME}=${encodeURIComponent(json)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
        // Ignorar errores de cookie
    }
    if (dispatchEvent) {
        try {
            window.dispatchEvent(new CustomEvent('gdev:license-updated'));
        } catch {
            // Ignorar
        }
    }
}

export function readLicenseFlags(): LicenseFlags {
    if (typeof window === 'undefined') return {};

    let raw: string | null = null;
    try {
        raw = window.localStorage.getItem(LICENSE_FLAGS_STORAGE_KEY);
    } catch {
        raw = null;
    }
    if (!raw) {
        raw = readCookie(LICENSE_FLAGS_COOKIE_NAME);
    }

    let parsed: unknown = null;
    try {
        parsed = raw ? JSON.parse(raw) : null;
    } catch {
        parsed = null;
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return {};
    }

    const result: LicenseFlags = {};
    let changed = false;
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof value !== 'string') {
            changed = true;
            continue;
        }
        if (isExpired(value)) {
            changed = true;
            continue;
        }
        result[key] = value;
    }

    // Limpieza silenciosa de flags expirados sin disparar eventos en cascada
    if (changed) {
        writeLicenseFlags(result, false);
    }

    return result;
}

export function persistLicenseFlags(incoming: LicenseFlags): void {
    if (typeof window === 'undefined') return;

    const existing = readLicenseFlags();
    const merged: LicenseFlags = { ...existing };

    for (const [key, value] of Object.entries(incoming || {})) {
        if (typeof value !== 'string') continue;
        if (isExpired(value)) continue;
        merged[key] = value;
    }

    writeLicenseFlags(merged, true);
}

export function clearLicenseFlags(): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(LICENSE_FLAGS_STORAGE_KEY);
    } catch {
        // Ignorar
    }
    try {
        document.cookie = `${LICENSE_FLAGS_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    } catch {
        // Ignorar
    }
    try {
        window.dispatchEvent(new CustomEvent('gdev:license-updated'));
    } catch {
        // Ignorar
    }
}

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

    const refresh = useCallback(() => {
        const merged: string[] = [];

        // 1. Permisos del JWT (si existen)
        try {
            const token = window.localStorage.getItem('access_token');
            if (token) {
                const payload = decodeJwt(token);
                const extracted = (payload.features as string[]) || [];
                merged.push(...extracted);
            }
        } catch {
            // Token inválido o inexistente: se ignoran las features del JWT
        }

        // 2. Permisos de la licencia (filtrados por expiración)
        const licenseFlags = readLicenseFlags();
        merged.push(...Object.keys(licenseFlags));

        setFlags(Array.from(new Set(merged)));
    }, []);

    useEffect(() => {
        refresh();

        const onStorage = () => refresh();
        const onLicenseUpdated = () => refresh();

        window.addEventListener('storage', onStorage);
        window.addEventListener('gdev:license-updated', onLicenseUpdated);

        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('gdev:license-updated', onLicenseUpdated);
        };
    }, [refresh]);

    const hasFlag = (flag: string) => flags.includes(flag);

    return (
        <FlagContext.Provider value={{ flags, hasFlag }}>
            {children}
        </FlagContext.Provider>
    );
};

export const useFlags = () => useContext(FlagContext);