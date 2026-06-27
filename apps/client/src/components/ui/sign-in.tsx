import React, { useState, useRef } from 'react';
import { Eye, EyeOff, ClipboardCopy } from 'lucide-react';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);


// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  demoCredentials?: Array<{ label: string; email: string; password: string }>;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-all focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10 focus-within:bg-white dark:focus-within:bg-slate-900 shadow-xs">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-white/10 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl shrink-0" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-[11px] text-slate-400">{testimonial.handle}</p>
      <p className="mt-1.5 text-xs text-slate-200">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  demoCredentials = [],
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const fillCredentials = (email: string, password: string, idx: number) => {
    if (emailRef.current) emailRef.current.value = email;
    if (passwordRef.current) passwordRef.current.value = password;
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-sans w-[100dvw] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex justify-center p-8 md:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md my-auto py-6">
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <h1 className="animate-element animate-delay-100 text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">{title}</h1>
              <p className="animate-element animate-delay-200 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>

            <form className="space-y-4" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">Email Address</label>
                <GlassInputWrapper>
                  <input ref={emailRef} name="email" type="email" placeholder="name@example.com" className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" required />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input ref={passwordRef} name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 flex items-center cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4 text-slate-400 hover:text-slate-200 transition-colors" /> : <Eye className="w-4 h-4 text-slate-400 hover:text-slate-200 transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" name="rememberMe" className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-brand-500/30 text-brand-500 cursor-pointer" />
                  <span className="text-slate-500 dark:text-slate-400">Keep me signed in</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="hover:underline text-brand-500 dark:text-brand-400 font-semibold transition-colors">Reset password</a>
              </div>

              <button type="submit" className="animate-element animate-delay-600 w-full rounded-2xl bg-brand-500 hover:bg-brand-600 py-4 font-bold text-sm text-white shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 transition-all cursor-pointer mt-2">
                Sign In
              </button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center py-2">
              <span className="w-full border-t border-slate-200 dark:border-slate-800"></span>
              <span className="px-3 text-xs text-slate-400 bg-slate-50 dark:bg-slate-950 absolute">Or continue with</span>
            </div>

            <button onClick={onGoogleSignIn} className="animate-element animate-delay-800 w-full flex items-center justify-center gap-2.5 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                <GoogleIcon />
                <span>Continue with Google</span>
            </button>

            <p className="animate-element animate-delay-900 text-center text-sm text-slate-500 dark:text-slate-400">
              New to our platform? <a href="#" onClick={(e) => { e.preventDefault(); onCreateAccount?.(); }} className="text-brand-500 dark:text-brand-400 font-bold hover:underline transition-colors">Create Account</a>
            </p>

            {/* Demo Credentials Panel */}
            {demoCredentials.length > 0 && (
              <div className="animate-element animate-delay-900 mt-2 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-500/[0.03] dark:bg-white/[0.02] p-4 flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <ClipboardCopy size={10} />
                  Demo Credentials — click to auto-fill
                </p>
                {demoCredentials.map((cred, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => fillCredentials(cred.email, cred.password, idx)}
                    className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 hover:bg-brand-500/5 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-brand-500 transition-colors uppercase tracking-wider">{cred.label}</span>
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold">{cred.email}</span>
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{cred.password}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                      copiedIdx === idx
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-brand-500/10 group-hover:text-brand-500'
                    }`}>
                      {copiedIdx === idx ? '✓ Filled' : 'Fill'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url(${heroImageSrc})` }}>
            <div className="absolute inset-0 bg-slate-950/20 backdrop-brightness-[0.85]" />
          </div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" /></div>}
              {testimonials[2] && <div className="hidden 2xl:flex"><TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
