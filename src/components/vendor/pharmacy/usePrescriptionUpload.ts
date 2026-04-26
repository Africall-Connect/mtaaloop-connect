import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook that returns a file-input ref + click handler + onChange handler
 * for uploading prescriptions to the `prescriptions` Supabase storage bucket.
 *
 * Path convention: {vendorId}/{userId}/{timestamp}-{filename}
 * RLS allows the uploading customer + the vendor to read.
 */
export function usePrescriptionUpload(vendorId: string) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const triggerPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      if (!userId) {
        toast.error("Please sign in to upload a prescription.");
        return;
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${vendorId}/${userId}/${Date.now()}-${safeName}`;

      const { error } = await supabase.storage
        .from("prescriptions")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        console.error("Prescription upload error:", error);
        toast.error("Could not upload prescription. Please try again.");
      } else {
        toast.success(
          "Prescription received — a pharmacist will review and call you."
        );
      }

      // Reset input so picking the same file again still triggers onChange
      if (inputRef.current) inputRef.current.value = "";
    },
    [vendorId]
  );

  return { inputRef, triggerPicker, handleChange };
}
