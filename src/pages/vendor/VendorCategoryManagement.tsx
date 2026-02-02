import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CategoryManagement from './CategoryManagement';

export default function VendorCategoryManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get vendor profile ID from localStorage
  const vendorProfileId =
    typeof window !== 'undefined'
      ? localStorage.getItem('ml_vendor_profile_id')
      : null;

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/vendor/portal')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
              CATEGORY MANAGEMENT
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 overflow-x-hidden">
        <CategoryManagement vendorId={vendorProfileId || user?.id || ''} />
      </main>
    </div>
  );
}
