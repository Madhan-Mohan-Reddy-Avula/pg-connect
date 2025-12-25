-- Add UPI fields to pgs table
ALTER TABLE public.pgs 
ADD COLUMN upi_id text,
ADD COLUMN upi_qr_url text;

-- Create manual_payments table
CREATE TABLE public.manual_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  pg_id uuid NOT NULL REFERENCES public.pgs(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_purpose text NOT NULL DEFAULT 'rent',
  upi_transaction_id text NOT NULL,
  screenshot_url text,
  status text NOT NULL DEFAULT 'pending',
  verified_at timestamp with time zone,
  verified_by uuid,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manual_payments
CREATE POLICY "Guests can insert their payments"
ON public.manual_payments
FOR INSERT
WITH CHECK (guest_id IN (SELECT id FROM public.guests WHERE user_id = auth.uid()));

CREATE POLICY "Guests can view their payments"
ON public.manual_payments
FOR SELECT
USING (guest_id IN (SELECT id FROM public.guests WHERE user_id = auth.uid()));

CREATE POLICY "Owners can view payments for their PG"
ON public.manual_payments
FOR SELECT
USING (pg_id IN (SELECT id FROM public.pgs WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can update payments for their PG"
ON public.manual_payments
FOR UPDATE
USING (pg_id IN (SELECT id FROM public.pgs WHERE owner_id = auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_manual_payments_updated_at
BEFORE UPDATE ON public.manual_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', true);

-- Storage policies for payment screenshots
CREATE POLICY "Guests can upload payment screenshots"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view payment screenshots"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-screenshots');

-- Storage policies for UPI QR codes
CREATE POLICY "Owners can upload UPI QR codes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documents');