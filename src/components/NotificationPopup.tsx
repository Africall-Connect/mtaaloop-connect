import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Truck, Star, Bell, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PopupNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: Date;
}

interface NotificationPopupProps {
  notifications: PopupNotification[];
  onDismiss: (id: string) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  order: <ShoppingBag className="h-5 w-5 text-blue-500" />,
  delivery: <Truck className="h-5 w-5 text-green-500" />,
  review: <Star className="h-5 w-5 text-yellow-500" />,
  payment: <DollarSign className="h-5 w-5 text-emerald-500" />,
  system: <Bell className="h-5 w-5 text-purple-500" />,
  alert: <AlertTriangle className="h-5 w-5 text-red-500" />,
  promotion: <Bell className="h-5 w-5 text-orange-500" />,
  inventory: <ShoppingBag className="h-5 w-5 text-amber-500" />,
};

export function NotificationPopup({ notifications, onDismiss }: NotificationPopupProps) {
  return (
    <div className="fixed z-[100] flex flex-col gap-2 pointer-events-none bottom-20 left-3 right-3 sm:bottom-auto sm:top-4 sm:left-auto sm:right-4 sm:max-w-sm sm:w-full" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <AnimatePresence>
        {notifications.slice(0, 3).map((notif) => (
          <NotificationItem key={notif.id} notification={notif} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({ notification, onDismiss }: { notification: PopupNotification; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="pointer-events-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {typeIcons[notification.type] || <Bell className="h-5 w-5 text-gray-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {notification.title}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-7 w-7 -mr-1 -mt-1"
            onClick={() => onDismiss(notification.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
        className="h-0.5 bg-primary"
      />
    </motion.div>
  );
}
