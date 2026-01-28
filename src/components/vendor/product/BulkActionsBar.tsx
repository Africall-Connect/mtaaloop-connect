import { Button } from '@/components/ui/button';
import { Trash2, EyeOff, BadgeCheck } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkAction: (action: 'delete' | 'deactivate' | 'activate') => void;
}

export default function BulkActionsBar({ selectedCount, onClearSelection, onBulkAction }: BulkActionsBarProps) {
  return (
    <div className="sticky bottom-4 z-30">
      <div className="container mx-auto">
        <div className="bg-gray-800 text-white rounded-lg shadow-lg p-4 flex items-center justify-between">
          <p>{selectedCount} products selected</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onBulkAction('activate')}>
              <BadgeCheck className="h-4 w-4 mr-2" />
              Activate
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onBulkAction('deactivate')}>
              <EyeOff className="h-4 w-4 mr-2" />
              Deactivate
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onBulkAction('delete')}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
