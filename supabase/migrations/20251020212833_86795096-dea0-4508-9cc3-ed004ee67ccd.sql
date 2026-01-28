-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Enable realtime for deliveries table
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;