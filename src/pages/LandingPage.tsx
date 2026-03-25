import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Calendar,
  ArrowRight,
  CheckCircle2,
  Shield,
  Clock,
  Users,
  Mail,
  Github,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white selection:bg-zinc-900 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* LOGO */}
            <img src="/logo.png" alt="logo" className="flex w-12" />
            <span className="font-bold text-2xl tracking-tight text-zinc-900">
              CEP Hall
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="bg-zinc-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-zinc-800 transition-all active:scale-95"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-zinc-600 font-bold hover:text-zinc-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/login"
                  className="bg-zinc-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-zinc-800 transition-all active:scale-95"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl"
            >
              <h1 className="text-6xl sm:text-8xl font-bold text-zinc-900 tracking-tight leading-[0.9] mb-8">
                Book. <br />
                <span className="text-zinc-400"> Approve.</span> <br />
                Manage.
              </h1>
              <p className="text-xl sm:text-2xl text-zinc-500 max-w-2xl leading-relaxed mb-12">
                The simplest way to reserve campus resources. Schedule
                classrooms, labs, seminar halls, and facilities for classes,
                workshops, and events in seconds.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to={user ? "/dashboard" : "/login"}
                  className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-zinc-900/20"
                >
                  {user ? "Go to Dashboard" : "Start Booking Now"}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/calendar"
                  className="bg-white text-zinc-900 border-2 border-zinc-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-50 transition-all active:scale-95"
                >
                  View Live Calendar
                </Link>
              </div>
            </motion.div>

            {/* Decorative Grid */}
            <div className="absolute -right-20 top-0 w-1/2 h-full -z-10 opacity-10 pointer-events-none hidden lg:block">
              <div className="grid grid-cols-6 gap-4 h-full">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="border border-zinc-900 rounded-lg aspect-square"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold text-zinc-900">
                Instant Approval
              </h3>
              <p className="text-zinc-500 leading-relaxed">
                Automated workflows ensure your requests reach the right
                authorities instantly. No more physical letters.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold text-zinc-900">
                Real-time Availability
              </h3>
              <p className="text-zinc-500 leading-relaxed">
                See exactly when a resource is free with our high-precision
                availability bars and interactive calendar.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold text-zinc-900">
                Secure & Verified
              </h3>
              <p className="text-zinc-500 leading-relaxed">
                Multi-level verification by HODs, Staff, and Principal ensures
                every booking is legitimate and authorized.
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-300 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-10 grid gap-8 md:grid-cols-3">
          {/* Project Info */}
          <div>
            <h3 className="text-white font-bold text-lg">CEP Hall</h3>
            <p className="text-sm mt-2 text-zinc-400">
              A smart platform to manage and book campus resources for classes,
              workshops, meetings, and events.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-2">Quick Links</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <a href="/dashboard" className="hover:text-white">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/calendar" className="hover:text-white">
                  Calendar
                </a>
              </li>
              <li>
                <a href="/my-bookings" className="hover:text-white">
                  My Bookings
                </a>
              </li>
            </ul>
          </div>

          {/* Contact / Credits */}
          <div>
            {/* <h4 className="text-white font-semibold mb-2">Developer</h4> */}
            <p className="text-sm text-zinc-400">
              Developed for College of Engineering Perumon
            </p>

            <div className="flex gap-3 mt-3">
              <a
                href="https://github.com/aravinnndddd/cep-hall"
                target="_blank"
                className="hover:text-white"
              >
                <Github className="w-5 h-5" />
              </a>

              {/* <a
                href="mailto:your-email@example.com"
                className="hover:text-white"
              >
                <Mail className="w-5 h-5" />
              </a> */}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-zinc-800 text-center py-4 text-xs text-zinc-500">
          © {new Date().getFullYear()} CEP Hall. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
