import React from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Calendar, LogIn } from "lucide-react";
import { motion } from "motion/react";

const Login: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async () => {
    setError(null);
    try {
      await login();
      navigate("/");
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === "auth/unauthorized-domain") {
        console.info(`%cAction Required: Add "${window.location.hostname}" to your Firebase Authorized Domains.`, "color: #2563eb; font-weight: bold; font-size: 12px;");
      }
      
      if (error.code === "auth/invalid-api-key") {
        setError("Firebase API Key is invalid or missing. Please check your configuration in the Secrets panel.");
      } else if (error.code === "auth/unauthorized-domain") {
        setError(`This domain (${window.location.hostname}) is not authorized in your Firebase project. Please add it to Authentication > Settings > Authorized domains in the Firebase Console.`);
      } else {
        setError(error.message || "An unexpected error occurred during login.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-200 p-8 text-center"
      >
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">College Booker</h1>
        <p className="text-zinc-500 mb-8">Sign in to book labs and seminar halls for your department.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-left">
            {error}
          </div>
        )}
        
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-zinc-300 text-zinc-700 px-6 py-3 rounded-xl font-medium hover:bg-zinc-50 transition-all active:scale-[0.98]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>
        
        <div className="mt-8 pt-6 border-t border-zinc-100">
          <p className="text-xs text-zinc-400">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
