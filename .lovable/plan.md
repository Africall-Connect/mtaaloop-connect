
# Product Image Upload Feature Plan

## Overview

Enable vendors to upload product images directly from their device (in addition to the existing URL-based approach). The vendor can choose between entering an image URL or uploading a photo file.

---

## Database Changes

### 1. Add Storage Path Column to Products Table

A new column `image_storage_path` will track the Supabase storage path for uploaded images. This is essential for managing (updating/deleting) uploaded files.

### 2. Create Storage Bucket for Product Images

A public bucket `product-images` will store all product photos with:
- 5MB file size limit
- Allowed MIME types: jpeg, png, gif, webp
- RLS policies for secure vendor access

---

## SQL Migration Script

Run this in Supabase SQL Editor (Cloud View > Run SQL):

```sql
-- 1. Add image_storage_path column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_storage_path TEXT;

-- 2. Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 
  'product-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for product images

-- Allow anyone to view product images (public bucket)
CREATE POLICY "Public can view product images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

-- Allow authenticated vendors to upload to their folder
CREATE POLICY "Vendors can upload product images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'product-images' AND 
  (storage.foldername(name))[1] = 'products'
);

-- Allow vendors to update their own product images
CREATE POLICY "Vendors can update product images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'product-images');

-- Allow vendors to delete their own product images
CREATE POLICY "Vendors can delete product images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'product-images');
```

---

## Frontend Changes

### File 1: `src/types/database.ts`

Add the new field to the Product interface:

| Field | Type | Description |
|-------|------|-------------|
| `image_storage_path` | `string \| null` | Storage path for uploaded images |

### File 2: `src/types/common.ts`

Add `image_storage_path` to the ProductData interface.

### File 3: `src/components/vendor/product/ProductFormDialog.tsx`

Major UI and logic updates:

**New State Variables:**
- `imageFile`: The selected file object
- `imagePreview`: Local blob URL for preview
- `uploadMethod`: Toggle between `'url'` or `'upload'`
- `uploading`: Loading state during upload

**New UI Components:**
- Tabs component to switch between URL input and file upload
- Drag-and-drop zone with upload icon
- Image preview with remove button
- Upload progress indicator

**Upload Logic in handleSubmit:**
1. If `uploadMethod === 'upload'` and a file is selected:
   - Generate unique filename: `products/{vendorId}/{uuid}.{ext}`
   - Upload to `product-images` bucket
   - Get public URL
   - Set `image_storage_path` for tracking
2. If editing a product with a new image:
   - Delete old image from storage (if exists)
   - Upload new image
3. Save product with final `image_url` and `image_storage_path`

---

## UI Design

The image section will use a tabbed interface:

```text
+------------------------------------------+
| Product Image                            |
+------------------------------------------+
| [  Image URL  ] [  Upload Photo  ]       |  <-- Tabs
+------------------------------------------+
|                                          |
| URL Tab:                                 |
|   [Enter image URL...                  ] |
|                                          |
| Upload Tab:                              |
|   +----------------------------------+   |
|   |     📷                           |   |
|   |  Click to upload or drag & drop  |   |
|   |  PNG, JPG, GIF up to 5MB         |   |
|   +----------------------------------+   |
|                                          |
|   [Image Preview]  [❌ Remove]           |
+------------------------------------------+
```

---

## Technical Implementation Details

### File Upload Flow

```text
1. Vendor selects "Upload Photo" tab
2. Vendor clicks upload zone or drags file
3. File is validated (size < 5MB, correct type)
4. Local preview is generated using URL.createObjectURL()
5. On form submit:
   a. Upload file to Supabase storage
   b. Get public URL
   c. Save product with image_url = publicUrl
   d. Save image_storage_path for future management
```

### Storage Path Structure

```
product-images/
└── products/
    └── {vendor_id}/
        └── {uuid}.{extension}
```

This structure:
- Organizes images by vendor
- Uses UUIDs to prevent naming conflicts
- Enables vendor-specific access control

### Error Handling

- File too large: Show toast with 5MB limit message
- Invalid file type: Show toast with allowed types
- Upload failure: Show error, keep form open
- Network error: Retry option with exponential backoff

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/database.ts` | Add `image_storage_path?: string \| null` to Product interface |
| `src/types/common.ts` | Add `image_storage_path?: string` to ProductData interface |
| `src/components/vendor/product/ProductFormDialog.tsx` | Add upload UI, file handling, storage integration |

---

## Mobile Responsiveness

The upload zone will be fully responsive:
- Full-width on mobile
- Touch-friendly tap target (minimum 44px)
- Clear visual feedback on file selection
- Compact preview with remove button

---

## Security Considerations

1. **File Validation**: Client-side type and size checks before upload
2. **Storage RLS**: Only authenticated users can upload to `products/` folder
3. **Public Read**: Images are publicly viewable (required for product display)
4. **Path Structure**: Vendor ID in path prevents cross-vendor access for delete/update

---

## Summary

| Component | Action |
|-----------|--------|
| Database | Run SQL to add column and create bucket |
| Types | Update Product and ProductData interfaces |
| UI | Add tabbed image input (URL vs Upload) |
| Logic | Handle file upload to Supabase storage |
| Storage | Create `product-images` bucket with RLS policies |
