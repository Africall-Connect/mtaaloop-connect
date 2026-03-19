import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Settings, ShoppingBag, Star, AlertTriangle, DollarSign, Megaphone } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationPanelProps {
  onClose: () => void;
  vendorId: string;
}

export default function NotificationPanel({ onClose, vendorId }: NotificationPanelProps) {
  // Placeholder - notifications table doesn't exist yet
  const [notifications] = useState<Notification[]>([]);

  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      order: <ShoppingBag className="h-4 w-4" />,
      review: <Star className="h-4 w-4" />,
      inventory: <AlertTriangle className="h-4 w-4" />,
      payment: <DollarSign className="h-4 w-4" />,
      system: <Megaphone className="h-4 w-4" />
    };
    return icons[type] || <Megaphone className="h-4 w-4" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b sticky top-0 z-10 bg-background">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">🔔 Notifications</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-center py-8 text-muted-foreground">
            No notifications yet
          </div>
        </div>
      </div>
    </div>
  );
}
