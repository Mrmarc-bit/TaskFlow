import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export const AuthLayout: React.FC = () => {
  return (
    <div className="relative min-height-screen w-full flex items-center justify-center bg-slate-950 overflow-hidden font-sans">
      {/* Dynamic Animated Gradient Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-600/20 blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-600/20 blur-[120px] pointer-events-none animate-pulse duration-[6000ms]" />

      <main className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full"
        >
          {/* Outlet for Login / Register pages */}
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};
