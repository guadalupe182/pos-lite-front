'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUnreadNotifications } from '@/lib/api';
import { BellIcon } from '@heroicons/react/24/outline';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const notifications = await getUnreadNotifications();
        setUnreadCount(notifications.length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnread();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <Link href="/notifications" className="relative inline-flex items-center">
      <BellIcon className="h-6 w-6 text-gray-400 hover:text-white transition-colors" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[20px] min-h-[20px]">
          {unreadCount}
        </span>
      )}
    </Link>
  );
}