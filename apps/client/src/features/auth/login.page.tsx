import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { SignInPage } from '../../components/ui/sign-in';
import type { Testimonial } from '../../components/ui/sign-in';

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Amazing platform! The user experience is seamless and the features are exactly what I needed."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "This service has transformed how I work. Clean design, powerful features, and excellent support."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&q=80",
    name: "David Martinez",
    handle: "@davidcreates",
    text: "I've tried many platforms, but this one stands out. Intuitive, reliable, and genuinely helpful for productivity."
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken } = response.data.data;
      localStorage.setItem('taskflow-token', accessToken);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  const handleGoogleSignIn = () => {
    alert("Google Sign In integration is coming soon!");
  };

  const handleResetPassword = () => {
    alert("Password reset instructions have been disabled for this preview. Contact administrator.");
  };

  const handleCreateAccount = () => {
    navigate('/register');
  };

  return (
    <div className="relative w-full min-h-screen">
      {error && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-danger-accent/10 border border-danger-accent/20 text-danger-accent text-xs px-4 py-2.5 rounded-xl font-semibold shadow-2xl animate-fade-in">
          {error}
        </div>
      )}
      <SignInPage
        title={
          <span className="font-light tracking-tighter text-slate-800 dark:text-slate-100">
            Welcome to <span className="font-extrabold bg-linear-to-r from-brand-500 to-sky-accent bg-clip-text text-transparent">TaskFlow</span>
          </span>
        }
        description="Access your account and continue managing your workspace."
        heroImageSrc="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80"
        testimonials={sampleTestimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
        demoCredentials={[
          { label: 'Admin', email: 'admin@taskflow.dev', password: 'TaskFlowAdmin123!' },
          { label: 'Member', email: 'member@taskflow.dev', password: 'TaskFlowMember123!' },
        ]}
      />
    </div>
  );
};
export default LoginPage;
