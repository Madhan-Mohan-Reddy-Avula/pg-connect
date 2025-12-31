import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, UserCog, Edit2, Trash2, Mail, Phone, Shield, Eye, Settings, Search, BookOpen, Download } from 'lucide-react';
import { format } from 'date-fns';
import { generateUserManual } from '@/utils/generateUserManual';

interface Manager {
  id: string;
  pg_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  can_view_guests: boolean;
  can_manage_guests: boolean;
  can_view_rents: boolean;
  can_manage_rents: boolean;
  can_view_payments: boolean;
  can_verify_payments: boolean;
  can_view_complaints: boolean;
  can_manage_complaints: boolean;
  can_view_expenses: boolean;
  can_manage_expenses: boolean;
  can_view_rooms: boolean;
  can_manage_rooms: boolean;
  can_view_announcements: boolean;
  can_manage_announcements: boolean;
  can_view_analytics: boolean;
}

interface PermissionGroup {
  label: string;
  viewKey: keyof Manager;
  manageKey?: keyof Manager;
  manageLabel?: string;
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  { label: 'Guests', viewKey: 'can_view_guests', manageKey: 'can_manage_guests', manageLabel: 'Add/Edit/Delete' },
  { label: 'Rents', viewKey: 'can_view_rents', manageKey: 'can_manage_rents', manageLabel: 'Mark Paid' },
  { label: 'Payments', viewKey: 'can_view_payments', manageKey: 'can_verify_payments', manageLabel: 'Verify' },
  { label: 'Complaints', viewKey: 'can_view_complaints', manageKey: 'can_manage_complaints', manageLabel: 'Close/Reopen' },
  { label: 'Expenses', viewKey: 'can_view_expenses', manageKey: 'can_manage_expenses', manageLabel: 'Add/Edit/Delete' },
  { label: 'Rooms', viewKey: 'can_view_rooms', manageKey: 'can_manage_rooms', manageLabel: 'Add/Edit/Delete' },
  { label: 'Announcements', viewKey: 'can_view_announcements', manageKey: 'can_manage_announcements', manageLabel: 'Create/Edit' },
  { label: 'Analytics', viewKey: 'can_view_analytics' },
];

const DEFAULT_PERMISSIONS = {
  can_view_guests: true,
  can_manage_guests: false,
  can_view_rents: true,
  can_manage_rents: false,
  can_view_payments: true,
  can_verify_payments: false,
  can_view_complaints: true,
  can_manage_complaints: false,
  can_view_expenses: false,
  can_manage_expenses: false,
  can_view_rooms: true,
  can_manage_rooms: false,
  can_view_announcements: true,
  can_manage_announcements: false,
  can_view_analytics: false,
};

export default function ManagersManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState<Manager | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    ...DEFAULT_PERMISSIONS,
  });

  const { data: pg } = useQuery({
    queryKey: ['owner-pg', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pgs')
        .select('*')
        .eq('owner_id', user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: managers, isLoading } = useQuery({
    queryKey: ['managers', pg?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('managers')
        .select('*')
        .eq('pg_id', pg!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Manager[];
    },
    enabled: !!pg?.id,
  });

  const addManagerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // First check if the user exists with this email
      // For now, we'll create a placeholder user_id that will be linked when they sign up
      // In production, you'd want to invite them via email
      
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', data.email)
        .maybeSingle();

      if (!existingUser) {
        throw new Error('No user found with this email. The manager must first create an account.');
      }

      const { error } = await supabase.from('managers').insert({
        pg_id: pg!.id,
        user_id: existingUser.user_id,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        can_view_guests: data.can_view_guests,
        can_manage_guests: data.can_manage_guests,
        can_view_rents: data.can_view_rents,
        can_manage_rents: data.can_manage_rents,
        can_view_payments: data.can_view_payments,
        can_verify_payments: data.can_verify_payments,
        can_view_complaints: data.can_view_complaints,
        can_manage_complaints: data.can_manage_complaints,
        can_view_expenses: data.can_view_expenses,
        can_manage_expenses: data.can_manage_expenses,
        can_view_rooms: data.can_view_rooms,
        can_manage_rooms: data.can_manage_rooms,
        can_view_announcements: data.can_view_announcements,
        can_manage_announcements: data.can_manage_announcements,
        can_view_analytics: data.can_view_analytics,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Manager added', description: 'Manager has been added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateManagerMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from('managers')
        .update({
          name: data.name,
          phone: data.phone || null,
          can_view_guests: data.can_view_guests,
          can_manage_guests: data.can_manage_guests,
          can_view_rents: data.can_view_rents,
          can_manage_rents: data.can_manage_rents,
          can_view_payments: data.can_view_payments,
          can_verify_payments: data.can_verify_payments,
          can_view_complaints: data.can_view_complaints,
          can_manage_complaints: data.can_manage_complaints,
          can_view_expenses: data.can_view_expenses,
          can_manage_expenses: data.can_manage_expenses,
          can_view_rooms: data.can_view_rooms,
          can_manage_rooms: data.can_manage_rooms,
          can_view_announcements: data.can_view_announcements,
          can_manage_announcements: data.can_manage_announcements,
          can_view_analytics: data.can_view_analytics,
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      setIsDialogOpen(false);
      setEditingManager(null);
      resetForm();
      toast({ title: 'Manager updated', description: 'Permissions updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteManagerMutation = useMutation({
    mutationFn: async (managerId: string) => {
      const { error } = await supabase.from('managers').delete().eq('id', managerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      toast({ title: 'Manager removed', description: 'Manager has been removed successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      ...DEFAULT_PERMISSIONS,
    });
  };

  const handleOpenDialog = (manager?: Manager) => {
    if (manager) {
      setEditingManager(manager);
      setFormData({
        name: manager.name,
        email: manager.email,
        phone: manager.phone || '',
        can_view_guests: manager.can_view_guests,
        can_manage_guests: manager.can_manage_guests,
        can_view_rents: manager.can_view_rents,
        can_manage_rents: manager.can_manage_rents,
        can_view_payments: manager.can_view_payments,
        can_verify_payments: manager.can_verify_payments,
        can_view_complaints: manager.can_view_complaints,
        can_manage_complaints: manager.can_manage_complaints,
        can_view_expenses: manager.can_view_expenses,
        can_manage_expenses: manager.can_manage_expenses,
        can_view_rooms: manager.can_view_rooms,
        can_manage_rooms: manager.can_manage_rooms,
        can_view_announcements: manager.can_view_announcements,
        can_manage_announcements: manager.can_manage_announcements,
        can_view_analytics: manager.can_view_analytics,
      });
    } else {
      setEditingManager(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingManager) {
      updateManagerMutation.mutate({ ...formData, id: editingManager.id });
    } else {
      addManagerMutation.mutate(formData);
    }
  };

  const handleDeleteClick = (manager: Manager) => {
    setManagerToDelete(manager);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (managerToDelete) {
      deleteManagerMutation.mutate(managerToDelete.id);
    }
    setDeleteConfirmOpen(false);
    setManagerToDelete(null);
  };

  const countPermissions = (manager: Manager) => {
    let count = 0;
    PERMISSION_GROUPS.forEach(group => {
      if (manager[group.viewKey]) count++;
      if (group.manageKey && manager[group.manageKey]) count++;
    });
    return count;
  };

  const filteredManagers = managers?.filter(manager => {
    const matchesSearch = searchQuery === '' ||
      manager.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manager.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (!pg) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please set up your PG first</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Managers</h1>
            <p className="text-muted-foreground">Add managers and control their access permissions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => generateUserManual('manager')}
              className="flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Manager Manual</span>
              <Download className="w-4 h-4" />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="bg-foreground text-background hover:bg-foreground/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Manager
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingManager ? 'Edit Manager' : 'Add New Manager'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Manager name"
                        className="bg-secondary/50 border-border"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="manager@example.com"
                        className="bg-secondary/50 border-border"
                        required
                        disabled={!!editingManager}
                      />
                      {!editingManager && (
                        <p className="text-xs text-muted-foreground">Manager must have an existing account with this email</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Phone number"
                        className="bg-secondary/50 border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-base font-semibold">Permissions</Label>
                    </div>
                    
                    <div className="space-y-4">
                      {PERMISSION_GROUPS.map((group) => (
                        <div key={group.label} className="border border-border rounded-lg p-3 space-y-3">
                          <p className="font-medium text-sm">{group.label}</p>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">View</span>
                              </div>
                              <Switch
                                checked={formData[group.viewKey as keyof typeof formData] as boolean}
                                onCheckedChange={(checked) => 
                                  setFormData({ ...formData, [group.viewKey]: checked })
                                }
                              />
                            </div>
                            {group.manageKey && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Settings className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm">{group.manageLabel || 'Manage'}</span>
                                </div>
                                <Switch
                                  checked={formData[group.manageKey as keyof typeof formData] as boolean}
                                  onCheckedChange={(checked) => 
                                    setFormData({ ...formData, [group.manageKey!]: checked })
                                  }
                                  disabled={!formData[group.viewKey as keyof typeof formData]}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-foreground text-background hover:bg-foreground/90" 
                      disabled={addManagerMutation.isPending || updateManagerMutation.isPending}
                    >
                      {editingManager ? 'Update Manager' : 'Add Manager'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search managers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50 border-border"
          />
        </div>

        {/* Stats */}
        <Card className="premium-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <UserCog className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Managers</p>
                <p className="text-2xl font-bold">{managers?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Managers List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredManagers?.length === 0 ? (
          <Card className="premium-card">
            <CardContent className="py-12 text-center">
              <UserCog className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {managers?.length === 0 ? 'No managers yet' : 'No matching managers'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {managers?.length === 0 ? 'Add managers to help you run your PG' : 'Try a different search'}
              </p>
              {managers?.length === 0 && (
                <Button onClick={() => handleOpenDialog()} className="bg-foreground text-background hover:bg-foreground/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Manager
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredManagers?.map((manager) => (
              <Card key={manager.id} className="premium-card">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                        <UserCog className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">{manager.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span>{manager.email}</span>
                        </div>
                        {manager.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{manager.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            {countPermissions(manager)} permissions
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Added {format(new Date(manager.created_at), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-16 sm:ml-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(manager)}
                        className="border-border"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(manager)}
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Remove Manager"
        description={`Are you sure you want to remove ${managerToDelete?.name} as a manager? They will lose all access to this PG.`}
        confirmText="Remove"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  );
}
