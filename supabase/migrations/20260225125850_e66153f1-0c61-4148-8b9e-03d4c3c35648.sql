-- Make invoices bucket private (contains sensitive financial documents)
UPDATE storage.buckets SET public = false WHERE id = 'invoices';