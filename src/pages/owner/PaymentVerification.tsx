import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Clock, Eye, Image } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";

interface Payment {
  id: string;
  guest_id: string;
  pg_id: string;
  amount: number;
  payment_purpose: string;
  upi_transaction_id: string;
  screenshot_url: string | null;
  status: string;
  created_at: string;
  guest?: {
    full_name: string;
    phone: string;
  };
}

const PaymentVerification = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: payments, isLoading } = useQuery({
    queryKey: ["owner-payments", user?.id],
    queryFn: async () => {
      const { data: pg } = await supabase
        .from("pgs")
        .select("id")
        .eq("owner_id", user?.id)
        .maybeSingle();

      if (!pg) return [];

      const { data, error } = await supabase
        .from("manual_payments")
        .select(`
          *,
          guest:guests(full_name, phone)
        `)
        .eq("pg_id", pg.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user,
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const updateData: any = {
        status,
        verified_at: status !== "pending" ? new Date().toISOString() : null,
        verified_by: user?.id,
      };
      if (reason) updateData.rejection_reason = reason;

      const { error } = await supabase
        .from("manual_payments")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["owner-payments"] });
      toast({
        title: "Success",
        description: `Payment ${variables.status === "verified" ? "verified" : "rejected"} successfully`,
      });
      setSelectedPayment(null);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const pendingPayments = payments?.filter(p => p.status === "pending") || [];
  const processedPayments = payments?.filter(p => p.status !== "pending") || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payment Verification</h1>
          <p className="text-muted-foreground">
            Review and verify payments submitted by guests
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingPayments.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold">
                    {payments?.filter(p => p.status === "verified").length || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">
                    {payments?.filter(p => p.status === "rejected").length || 0}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Verification</CardTitle>
            <CardDescription>Payments awaiting your review</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingPayments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No pending payments to verify
              </p>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{payment.guest?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.guest?.phone}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">₹{payment.amount}</span> - {payment.payment_purpose}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Transaction ID: {payment.upi_transaction_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.created_at), "PPp")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {payment.screenshot_url && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Image className="h-4 w-4 mr-1" />
                              Screenshot
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Payment Screenshot</DialogTitle>
                            </DialogHeader>
                            <img
                              src={payment.screenshot_url}
                              alt="Payment screenshot"
                              className="w-full rounded-lg"
                            />
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button
                        size="sm"
                        onClick={() => updatePaymentMutation.mutate({ id: payment.id, status: "verified" })}
                        disabled={updatePaymentMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Payment</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Input
                                placeholder="Reason for rejection (optional)"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                              />
                            </div>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                updatePaymentMutation.mutate({
                                  id: payment.id,
                                  status: "rejected",
                                  reason: rejectionReason,
                                });
                              }}
                              disabled={updatePaymentMutation.isPending}
                            >
                              Confirm Rejection
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processed Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Previously processed payments</CardDescription>
          </CardHeader>
          <CardContent>
            {processedPayments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No payment history yet
              </p>
            ) : (
              <div className="space-y-4">
                {processedPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{payment.guest?.full_name}</p>
                      <p className="text-sm">
                        <span className="font-medium">₹{payment.amount}</span> - {payment.payment_purpose}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Transaction ID: {payment.upi_transaction_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.created_at), "PPp")}
                      </p>
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

export default PaymentVerification;
