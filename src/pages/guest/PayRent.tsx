import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, QrCode, CreditCard, Upload, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Payment {
  id: string;
  amount: number;
  payment_purpose: string;
  upi_transaction_id: string;
  screenshot_url: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

const PayRent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("rent");
  const [transactionId, setTransactionId] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Fetch guest and PG details
  const { data: guestData, isLoading: loadingGuest } = useQuery({
    queryKey: ["guest-pg-details", user?.id],
    queryFn: async () => {
      const { data: guest, error: guestError } = await supabase
        .from("guests")
        .select("id, pg_id, monthly_rent")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (guestError) throw guestError;
      if (!guest) return null;

      const { data: pg, error: pgError } = await supabase
        .from("pgs")
        .select("id, name, upi_id, upi_qr_url")
        .eq("id", guest.pg_id)
        .maybeSingle();

      if (pgError) throw pgError;

      return { guest, pg };
    },
    enabled: !!user,
  });

  // Fetch payment history
  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ["guest-payments", user?.id],
    queryFn: async () => {
      const { data: guest } = await supabase
        .from("guests")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!guest) return [];

      const { data, error } = await supabase
        .from("manual_payments")
        .select("*")
        .eq("guest_id", guest.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user,
  });

  const submitPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!guestData?.guest || !guestData?.pg) throw new Error("Guest data not found");

      const { error } = await supabase.from("manual_payments").insert({
        guest_id: guestData.guest.id,
        pg_id: guestData.pg.id,
        amount: parseFloat(amount),
        payment_purpose: purpose,
        upi_transaction_id: transactionId.trim(),
        screenshot_url: screenshotUrl || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-payments"] });
      toast({
        title: "Payment Submitted",
        description: "Your payment has been submitted for verification. You will be notified once it's verified.",
      });
      setAmount("");
      setTransactionId("");
      setScreenshotUrl("");
      setPurpose("rent");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !guestData?.guest) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `payment-${guestData.guest.id}-${Date.now()}.${fileExt}`;
      const filePath = `screenshots/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("payment-screenshots")
        .getPublicUrl(filePath);

      setScreenshotUrl(publicUrl);
      toast({
        title: "Success",
        description: "Screenshot uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (!transactionId.trim()) {
      toast({
        title: "Error",
        description: "Please enter the UPI transaction ID",
        variant: "destructive",
      });
      return;
    }

    submitPaymentMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (loadingGuest) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!guestData?.pg?.upi_id) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <p>UPI payment is not yet configured by the PG owner. Please contact them for payment details.</p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pay Rent</h1>
          <p className="text-muted-foreground">
            Make payment via UPI and submit details for verification
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* UPI Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                PG Owner UPI Details
              </CardTitle>
              <CardDescription>
                Scan QR code or use UPI ID to make payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-sm text-muted-foreground">UPI ID</Label>
                <p className="text-lg font-mono font-medium">{guestData.pg.upi_id}</p>
              </div>

              {guestData.pg.upi_qr_url && (
                <div className="text-center">
                  <Label className="text-sm text-muted-foreground">Scan QR Code</Label>
                  <img
                    src={guestData.pg.upi_qr_url}
                    alt="UPI QR Code"
                    className="w-48 h-48 object-contain mx-auto border rounded-lg mt-2"
                  />
                </div>
              )}

              {guestData.guest.monthly_rent > 0 && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <Label className="text-sm text-muted-foreground">Monthly Rent</Label>
                  <p className="text-2xl font-bold text-primary">₹{guestData.guest.monthly_rent}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Payment Details</CardTitle>
              <CardDescription>
                After making payment, enter the transaction details below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose">Payment Purpose</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="advance">Advance</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="electricity">Electricity</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction-id">UPI Transaction ID</Label>
                  <Input
                    id="transaction-id"
                    placeholder="Enter transaction/reference ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Screenshot (Optional)</Label>
                  {screenshotUrl ? (
                    <div className="space-y-2">
                      <img
                        src={screenshotUrl}
                        alt="Payment screenshot"
                        className="w-full max-h-48 object-contain border rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setScreenshotUrl("")}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="screenshot-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                          {uploading ? (
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          ) : (
                            <>
                              <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mt-1">
                                Click to upload screenshot
                              </p>
                            </>
                          )}
                        </div>
                      </Label>
                      <Input
                        id="screenshot-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleScreenshotUpload}
                        disabled={uploading}
                      />
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitPaymentMutation.isPending}
                >
                  {submitPaymentMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Submit Payment for Verification
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Your Payment History</CardTitle>
            <CardDescription>Track the status of your submitted payments</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPayments ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : payments?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No payment history yet
              </p>
            ) : (
              <div className="space-y-4">
                {payments?.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">₹{payment.amount}</span>
                        <span className="text-muted-foreground">-</span>
                        <span className="capitalize">{payment.payment_purpose}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Transaction ID: {payment.upi_transaction_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.created_at), "PPp")}
                      </p>
                      {payment.status === "rejected" && payment.rejection_reason && (
                        <p className="text-sm text-destructive">
                          Reason: {payment.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div>{getStatusBadge(payment.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PayRent;
