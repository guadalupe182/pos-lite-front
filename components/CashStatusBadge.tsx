'use client';

interface CashStatusBadgeProps {
  isOpen: boolean;
  loading?: boolean;
}

export default function CashStatusBadge({ isOpen, loading }: CashStatusBadgeProps) {
  if (loading) {
    return (
      <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-500">
        <span className="w-2 h-2 mr-2 bg-gray-400 rounded-full animate-pulse" />
        Cargando...
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
        isOpen
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      <span
        className={`w-2 h-2 mr-2 rounded-full ${
          isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`}
      />
      {isOpen ? 'Caja Abierta' : 'Caja Cerrada'}
    </span>
  );
}