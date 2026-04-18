import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield, Users, Globe, Database, Activity,
  Upload, RefreshCw, Trash2, FileText, CheckCircle, XCircle, Clock, UserCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'PUBLIC' | 'REGISTERED' | 'RESEARCHER' | 'CONTRIBUTOR' | 'INSTITUTIONAL' | 'ADMIN';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
}

const ROLES: UserRole[] = ['PUBLIC', 'REGISTERED', 'RESEARCHER', 'CONTRIBUTOR', 'INSTITUTIONAL', 'ADMIN'];

const roleBadgeVariant: Record<UserRole, string> = {
  ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
  CONTRIBUTOR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  INSTITUTIONAL: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  RESEARCHER: 'bg-green-500/20 text-green-400 border-green-500/30',
  REGISTERED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  PUBLIC: 'bg-gray-600/20 text-gray-500 border-gray-600/30',
};

const mockStats = [
  { label: 'Total Users', value: '—', icon: Users, change: '' },
  { label: 'Countries with Data', value: '54', icon: Globe, change: 'Active' },
  { label: 'Data Points', value: '—', icon: Database, change: '' },
  { label: 'Active Sessions', value: 'Live', icon: Activity, change: '' },
];

const Admin = () => {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [pendingRoles, setPendingRoles] = useState<Record<string, UserRole>>({});

  // Platform stats
  const { data: platformStats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const token = getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      return fetch(`${import.meta.env.VITE_API_URL || '/api'}/platform/stats`, { headers })
        .then(r => r.ok ? r.json() : null).catch(() => null);
    },
  });

  // All users from Supabase (admin RLS policy allows this)
  const { data: userRows, isLoading: usersLoading } = useQuery<UserRow[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('User')
        .select('id, email, name, role, createdAt')
        .order('createdAt', { ascending: false });
      if (error) throw new Error(error.message);
      return data as UserRow[];
    },
  });

  // Update role mutation
  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase
        .from('User')
        .update({ role })
        .eq('id', userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, { userId, role }) => {
      setPendingRoles(prev => { const n = { ...prev }; delete n[userId]; return n; });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Role updated', description: `Role changed to ${role}.` });
    },
    onError: (err) => {
      toast({ title: 'Failed to update role', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    },
  });

  const stats = platformStats ? [
    { label: 'Total Countries', value: String(platformStats.countries ?? 54), icon: Globe, change: 'Active' },
    { label: 'Indicators', value: String(platformStats.indicators ?? 59), icon: Database, change: `${platformStats.themes ?? 9} themes` },
    { label: 'Data Points', value: platformStats.indicatorValues ? `${(platformStats.indicatorValues / 1000).toFixed(1)}K` : '—', icon: Activity, change: 'Live' },
    { label: 'Registered Users', value: String(userRows?.length ?? '—'), icon: Users, change: '' },
  ] : [
    ...mockStats.slice(0, 3),
    { label: 'Registered Users', value: String(userRows?.length ?? '—'), icon: Users, change: '' },
  ];

  const handleClearCache = async () => {
    const token = getToken();
    try {
      await fetch(`${import.meta.env.VITE_API_URL || '/api'}/platform/clear-cache`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      toast({ title: 'Cache cleared' });
    } catch {
      toast({ title: 'Could not clear cache', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/30 border-b">
        <div className="container px-4 md:px-6 py-6 flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage users, data, and platform operations</p>
          </div>
          {!platformStats && <Badge variant="secondary" className="ml-auto text-xs">Offline mode</Badge>}
        </div>
      </div>

      <div className="container px-4 md:px-6 py-8 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h2 className="text-lg font-semibold">User Management</h2>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !userRows?.length ? (
              <p className="text-sm text-muted-foreground py-4">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Name</th>
                      <th className="pb-3 pr-4 font-medium">Email</th>
                      <th className="pb-3 pr-4 font-medium">Current Role</th>
                      <th className="pb-3 pr-4 font-medium">Change Role</th>
                      <th className="pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {userRows.map((u) => {
                      const pendingRole = pendingRoles[u.id];
                      const isDirty = pendingRole && pendingRole !== u.role;
                      return (
                        <tr key={u.id} className="py-2">
                          <td className="py-3 pr-4 font-medium">{u.name || '—'}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleBadgeVariant[u.role]}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <Select
                              value={pendingRole ?? u.role}
                              onValueChange={(val) =>
                                setPendingRoles(prev => ({ ...prev, [u.id]: val as UserRole }))
                              }
                            >
                              <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map(r => (
                                  <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3">
                            <Button
                              size="sm"
                              variant={isDirty ? 'default' : 'ghost'}
                              disabled={!isDirty || updateRole.isPending}
                              className="h-8 gap-1 text-xs"
                              onClick={() => updateRole.mutate({ userId: u.id, role: pendingRole! })}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Save
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Expert Registrations */}
        <PendingExperts />

        {/* Quick Actions */}
        <Card className="max-w-sm">
          <CardHeader>
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              { label: 'Import Data', icon: Upload, variant: 'default' as const, onClick: undefined },
              { label: 'Recalculate Index', icon: RefreshCw, variant: 'outline' as const, onClick: undefined },
              { label: 'Clear Cache', icon: Trash2, variant: 'outline' as const, onClick: handleClearCache },
              { label: 'View Logs', icon: FileText, variant: 'outline' as const, onClick: undefined },
            ].map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                className="w-full justify-start gap-2"
                onClick={action.onClick}
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function PendingExperts() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<{ id: string; name: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const apiBase = import.meta.env.VITE_API_URL || '/api';

  const { data: experts, isLoading } = useQuery({
    queryKey: ['admin-pending-experts'],
    queryFn: async () => {
      try {
        const res = await fetch(`${apiBase}/experts?verified=false&pageSize=50`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.data || [];
      } catch {
        return [];
      }
    },
  });

  const handleApprove = async (id: string) => {
    try {
      await fetch(`${apiBase}/experts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED', verified: true }),
      });
      toast({ title: 'Expert approved', description: 'The expert has been notified.' });
      qc.invalidateQueries({ queryKey: ['admin-pending-experts'] });
    } catch {
      toast({ title: 'Failed to approve', variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    try {
      await fetch(`${apiBase}/experts/${rejectDialog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason }),
      });
      toast({ title: 'Expert rejected', description: 'The expert has been notified.' });
      qc.invalidateQueries({ queryKey: ['admin-pending-experts'] });
      setRejectDialog(null);
      setRejectionReason('');
    } catch {
      toast({ title: 'Failed to reject', variant: 'destructive' });
    }
  };

  const pendingExperts = (experts || []).filter((e: any) => !e.verified);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Pending Expert Registrations</h2>
            {pendingExperts.length > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 ml-2">
                {pendingExperts.length} pending
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pendingExperts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <CheckCircle className="h-4 w-4 text-green-500" />
              No pending expert registrations
            </div>
          ) : (
            <div className="space-y-3">
              {pendingExperts.map((expert: any) => (
                <div key={expert.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-white/[0.02]">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{expert.name}</p>
                    <p className="text-xs text-muted-foreground">{expert.title} at {expert.organization}</p>
                    <p className="text-xs text-muted-foreground">{expert.email} · {expert.country?.name || 'Unknown'}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(expert.specializations || []).slice(0, 4).map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>
                      ))}
                      {(expert.specializations || []).length > 4 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{expert.specializations.length - 4}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Registered {new Date(expert.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => handleApprove(expert.id)}>
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => setRejectDialog({ id: expert.id, name: expert.name })}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reject Expert Registration</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Rejecting registration for <strong>{rejectDialog?.name}</strong>. Please provide a reason.
          </p>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection (will be sent to the applicant)..."
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Confirm Rejection</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Admin;
