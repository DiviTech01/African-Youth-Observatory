import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield, Users, Globe, Database, Activity,
  Upload, RefreshCw, Trash2, FileText,
} from 'lucide-react';

// ── Mock Data ─────────────────────────────────────────────────────────────────

const stats = [
  { label: 'Total Users', value: '12,847', icon: Users, change: '+3.2%' },
  { label: 'Countries with Data', value: '54', icon: Globe, change: '+2' },
  { label: 'Data Points', value: '1.4M', icon: Database, change: '+18K' },
  { label: 'Active Sessions', value: '342', icon: Activity, change: 'Live' },
];

const recentActivity = [
  { id: 1, text: 'Data import completed for Kenya', time: '2 minutes ago' },
  { id: 2, text: 'New user registered from Nigeria', time: '8 minutes ago' },
  { id: 3, text: 'Youth Index recalculated for Q1 2026', time: '25 minutes ago' },
  { id: 4, text: 'Bulk export requested by admin@ayd.org', time: '1 hour ago' },
  { id: 5, text: 'Data validation passed for Tanzania dataset', time: '2 hours ago' },
  { id: 6, text: 'Cache cleared successfully', time: '3 hours ago' },
];

const quickActions = [
  { label: 'Import Data', icon: Upload, variant: 'default' as const },
  { label: 'Recalculate Index', icon: RefreshCw, variant: 'outline' as const },
  { label: 'Clear Cache', icon: Trash2, variant: 'outline' as const },
  { label: 'View Logs', icon: FileText, variant: 'outline' as const },
];

// ── Admin Page ────────────────────────────────────────────────────────────────

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/30 border-b">
        <div className="container px-4 md:px-6 py-6 flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage data, users, and platform operations
            </p>
          </div>
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
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-lg font-semibold">Recent Activity</h2>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recentActivity.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-4 rounded-md border p-3"
                  >
                    <span className="text-sm">{item.text}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {item.time}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Quick Actions</h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant}
                  className="w-full justify-start gap-2"
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
