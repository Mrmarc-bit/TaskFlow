import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Shield, Moon, Sun, Monitor } from 'lucide-react';
import { api } from '../../lib/axios';
import { Card } from '../../components/card';
import { Input } from '../../components/input';
import { Button } from '../../components/button';
import { useThemeStore } from '../../store/theme.store';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useThemeStore();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch current profile
  const { data: profile } = useQuery<any>({
    queryKey: ['myProfile', 'settings'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data.data;
    },
  });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
    }
  }, [profile]);

  // 2. Settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      const response = await api.put('/users/settings', data);
      return response.data.data;
    },
    onSuccess: () => {
      setSuccessMsg('Profile settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update settings');
      setTimeout(() => setErrorMsg(null), 3000);
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && lastName.trim()) {
      updateSettingsMutation.mutate({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure profile identifiers and display configurations.</p>
      </div>

      {successMsg && (
        <div className="bg-success-accent/10 border border-success-accent/20 text-success-accent text-xs px-4 py-2.5 rounded-xl font-semibold">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-danger-accent/10 border border-danger-accent/20 text-danger-accent text-xs px-4 py-2.5 rounded-xl font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Profile settings card */}
      <Card className="p-6 border-slate-500/10 dark:border-white/5 flex flex-col gap-5">
        <h3 className="font-bold font-display text-sm flex items-center gap-2">
          <User size={16} className="text-brand-500" />
          <span>Profile Settings</span>
        </h3>
        
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <Input
            label="Email Address (read-only)"
            type="email"
            value={profile?.email || ''}
            disabled
            className="opacity-60 cursor-not-allowed"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-32 self-start mt-2 py-2"
            disabled={updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </Card>

      {/* Theme Preference Settings card */}
      <Card className="p-6 border-slate-500/10 dark:border-white/5 flex flex-col gap-4">
        <h3 className="font-bold font-display text-sm flex items-center gap-2">
          <Moon size={16} className="text-purple-500" />
          <span>Interface theme preference</span>
        </h3>
        <p className="text-xs text-slate-500">Configure how the workspace rendering behaves on your system.</p>
        
        <div className="grid grid-cols-3 gap-3.5 mt-2">
          {/* Light */}
          <button
            onClick={() => setTheme('light')}
            className={`p-3.5 border rounded-xl flex items-center gap-2.5 font-semibold text-xs justify-center transition-colors cursor-pointer ${
              theme === 'light'
                ? 'border-brand-500 bg-brand-500/5 text-brand-500'
                : 'border-slate-500/10 bg-slate-500/5 dark:bg-white/[0.01]'
            }`}
          >
            <Sun size={14} />
            <span>Light</span>
          </button>
          
          {/* Dark */}
          <button
            onClick={() => setTheme('dark')}
            className={`p-3.5 border rounded-xl flex items-center gap-2.5 font-semibold text-xs justify-center transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'border-brand-500 bg-brand-500/5 text-brand-500'
                : 'border-slate-500/10 bg-slate-500/5 dark:bg-white/[0.01]'
            }`}
          >
            <Moon size={14} />
            <span>Dark</span>
          </button>
          
          {/* System */}
          <button
            onClick={() => setTheme('system')}
            className={`p-3.5 border rounded-xl flex items-center gap-2.5 font-semibold text-xs justify-center transition-colors cursor-pointer ${
              theme === 'system'
                ? 'border-brand-500 bg-brand-500/5 text-brand-500'
                : 'border-slate-500/10 bg-slate-500/5 dark:bg-white/[0.01]'
            }`}
          >
            <Monitor size={14} />
            <span>System</span>
          </button>
        </div>
      </Card>

      {/* Security & Token scopes info card */}
      <Card className="p-6 border-slate-500/10 dark:border-white/5 flex flex-col gap-4">
        <h3 className="font-bold font-display text-sm flex items-center gap-2">
          <Shield size={16} className="text-emerald-500" />
          <span>Workspace Security</span>
        </h3>
        <div className="flex flex-col gap-2 text-xs leading-relaxed text-slate-500">
          <p>
            Your session is secured using standard **Refresh Token Rotation (RTR)** parameters. Tokens rotate automatically on every background request to prevent session hijacking.
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success-accent animate-ping" />
            <span className="text-[10px] font-bold text-success-accent">RTR compromise detection engine is active.</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
