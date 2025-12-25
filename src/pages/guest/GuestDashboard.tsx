import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, BedDouble, Home, IndianRupee, Calendar, Phone, MapPin, ScrollText } from 'lucide-react';
import { format } from 'date-fns';

export default function GuestDashboard() {
  const { user } = useAuth();

  // Fetch guest details with PG, room, bed info
  const { data: guest, isLoading: guestLoading } = useQuery({
    queryKey: ['guest-details', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*, bed:beds(bed_number, room:rooms(room_number, floor))')
        .eq('user_id', user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch PG details
  const { data: pg } = useQuery({
    queryKey: ['guest-pg', guest?.pg_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pgs')
        .select('*')
        .eq('id', guest!.pg_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!guest?.pg_id,
  });

  // Fetch current month rent status
  const { data: currentRent } = useQuery({
    queryKey: ['current-rent', guest?.id],
    queryFn: async () => {
      const currentMonth = format(new Date(), 'yyyy-MM');
      const { data, error } = await supabase
        .from('rents')
        .select('*')
        .eq('guest_id', guest!.id)
        .gte('month', `${currentMonth}-01`)
        .lt('month', `${currentMonth}-32`)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!guest?.id,
  });

  // Fetch pending complaints count
  const { data: complaintsCount } = useQuery({
    queryKey: ['guest-complaints-count', guest?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('guest_id', guest!.id)
        .eq('status', 'open');
      if (error) throw error;
      return count || 0;
    },
    enabled: !!guest?.id,
  });

  if (guestLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-24 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!guest) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No PG Assigned</h2>
          <p className="text-muted-foreground">Please contact your PG owner to get assigned</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {guest.full_name}!</h1>
          <p className="text-muted-foreground">Here's your PG details at a glance</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Home className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Room</p>
                  <p className="font-bold">{guest.bed?.room?.room_number || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                  <BedDouble className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bed</p>
                  <p className="font-bold">{guest.bed?.bed_number || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Rent</p>
                  <p className="font-bold">₹{guest.monthly_rent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <ScrollText className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Open Complaints</p>
                  <p className="font-bold">{complaintsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PG Details Card */}
        {pg && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                {pg.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{pg.address}</p>
                    <p className="text-sm text-muted-foreground">{pg.city}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{pg.owner_name}</p>
                    <p className="text-sm">{pg.contact_number}</p>
                  </div>
                </div>
              </div>
              {pg.house_rules && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">House Rules</p>
                  <p className="text-sm whitespace-pre-wrap">{pg.house_rules}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rent Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary" />
              Current Month Rent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentRent ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(currentRent.month), 'MMMM yyyy')}
                  </p>
                  <p className="text-2xl font-bold">₹{currentRent.amount.toLocaleString()}</p>
                </div>
                <Badge 
                  variant={currentRent.status === 'paid' ? 'default' : 'secondary'}
                  className="text-sm px-4 py-2"
                >
                  {currentRent.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                </Badge>
              </div>
            ) : (
              <p className="text-muted-foreground">No rent entry for this month yet</p>
            )}
          </CardContent>
        </Card>

        {/* Stay Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Stay Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Check-in Date</p>
                <p className="font-medium">
                  {guest.check_in_date 
                    ? format(new Date(guest.check_in_date), 'dd MMM yyyy')
                    : 'Not recorded'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Floor</p>
                <p className="font-medium">{guest.bed?.room?.floor || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={guest.status === 'active' ? 'default' : 'secondary'}>
                  {guest.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
