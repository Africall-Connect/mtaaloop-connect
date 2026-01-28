import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { EstateList } from '@/components/admin/estate/EstateList';
import { EstateDetail } from '@/components/admin/estate/EstateDetail';
import ResidentsList from '@/components/admin/estate/ResidentsList';
import VendorsList from '@/components/admin/estate/VendorsList';

export const EstateManagement: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <Routes>
        <Route index element={
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Estate Management</h1>
            </div>
            <EstateList />
          </>
        } />
        <Route path=":id" element={<EstateDetail />} />
        <Route path=":id/residents" element={
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Estate Residents</h1>
            </div>
            <ResidentsList />
          </>
        } />
        <Route path=":id/vendors" element={
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Estate Vendors</h1>
            </div>
            <VendorsList />
          </>
        } />
      </Routes>
    </div>
  );
};

export default EstateManagement;
