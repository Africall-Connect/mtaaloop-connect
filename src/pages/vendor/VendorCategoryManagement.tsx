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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/vendor/portal')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">CATEGORY MANAGEMENT</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <CategoryManagement vendorId={vendorProfileId || user?.id || ''} />
      </main>
    </div>
  );
}
