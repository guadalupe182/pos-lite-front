"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCash } from "@/contexts/CashContext";
import CashStatusBadge from "./CashStatusBadge";
import OpenCashModal from "./OpenCashModal";
import CloseCashModal from "./CloseCashModal";
import NotificationBell from "./NotificationBell";
import { apiFetch, removeAuthToken } from "@/lib/api";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { refreshCashStatus } = useCash();

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      if (typeof removeAuthToken === "function") {
        removeAuthToken();
      }
      setIsOpen(false);
      router.push("/login");
    }
  };

  const navLinks = [
    { name: "Punto de Venta", href: "/sales" },
    { name: "Productos", href: "/products" },
    { name: "Ventas", href: "/history" },
  ];

  return (
      <>
        <nav className="bg-gray-900 text-white border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo / Brand */}
              <div className="flex items-center space-x-8">
                <Link href="/sales" className="text-xl font-bold text-indigo-400">
                  POS Lite
                </Link>

                {/* Links Desktop */}
                <div className="hidden md:flex space-x-4">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-gray-800 text-indigo-400"
                                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`}
                        >
                          {link.name}
                        </Link>
                    );
                  })}
                </div>
              </div>

              {/* Elementos derecha (Caja, Notificaciones, Logout) */}
              <div className="hidden md:flex items-center space-x-4">
                <CashStatusBadge
                    onOpenClick={() => setShowOpenModal(true)}
                    onCloseClick={() => setShowCloseModal(true)}
                />
                <NotificationBell />
                <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>

              {/* Menú Mobile */}
              <div className="md:hidden flex items-center space-x-3">
                <NotificationBell />
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
                >
                  <span className="sr-only">Abrir menú</span>
                  {isOpen ? "✕" : "☰"}
                </button>
              </div>
            </div>
          </div>

          {/* Panel Mobile */}
          {isOpen && (
              <div className="md:hidden bg-gray-900 border-b border-gray-800 px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                            pathname === link.href
                                ? "bg-gray-800 text-indigo-400"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                    >
                      {link.name}
                    </Link>
                ))}
                <div className="pt-2 border-t border-gray-800 space-y-2">
                  <CashStatusBadge
                      onOpenClick={() => {
                        setShowOpenModal(true);
                        setIsOpen(false);
                      }}
                      onCloseClick={() => {
                        setShowCloseModal(true);
                        setIsOpen(false);
                      }}
                  />
                  <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-red-600/80 hover:bg-red-600 text-white"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
          )}
        </nav>

        {/* Modales de Apertura/Cierre de Caja */}
        {showOpenModal && (
            <OpenCashModal
                isOpen={showOpenModal}
                onClose={() => setShowOpenModal(false)}
                onSuccess={() => {
                  setShowOpenModal(false);
                  if (refreshCashStatus) refreshCashStatus();
                }}
            />
        )}

        {showCloseModal && (
            <CloseCashModal
                isOpen={showCloseModal}
                onClose={() => setShowCloseModal(false)}
                onSuccess={() => {
                  setShowCloseModal(false);
                  if (refreshCashStatus) refreshCashStatus();
                }}
            />
        )}
      </>
  );
}