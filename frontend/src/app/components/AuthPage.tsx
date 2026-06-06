import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';

export default function AuthPage() {
  const navigate = useNavigate();
  const { startSlackAuth, error, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError ?? error;

  const handleSlackAuth = async () => {
    clearError();
    setLocalError(null);
    setIsLoading(true);
    try {
      await startSlackAuth();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to start Slack sign-in';
      setLocalError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Marketing */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-purple-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 mb-8">
              <div className="size-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="size-7 text-white" />
              </div>
              <span className="font-semibold text-2xl">slackbotfyi</span>
            </div>

            <h1 className="text-5xl font-semibold mb-6 leading-tight">
              Your Company Knowledge,
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Instantly Accessible
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-12">
              Connect your workspace and unlock AI-powered answers from your internal documentation.
            </p>

            <div className="space-y-6">
              {[
                'Connect Slack and Notion in seconds',
                'Automatic document syncing and indexing',
                'AI-powered semantic search with citations',
                'Enterprise-grade security and privacy',
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="size-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="size-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-foreground">{feature}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, 0],
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="mt-16 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 blur-3xl rounded-full" />
              <div className="relative grid grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 2 + i * 0.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="h-20 bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-white/10 rounded-xl"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Auth Card */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span className="text-sm">Back to home</span>
          </button>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="text-center mb-8">
              <div className="inline-flex size-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 items-center justify-center mb-4">
                <Sparkles className="size-9 text-white" />
              </div>
              <h2 className="text-3xl font-semibold mb-2">Welcome to slackbotfyi</h2>
              <p className="text-muted-foreground">
                Sign in with your Slack workspace to get started
              </p>
            </div>

            {displayError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {displayError}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleSlackAuth}
                disabled={isLoading}
                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-3 shadow-lg shadow-purple-500/20 disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <svg className="size-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.527 2.527 0 0 1 2.521 2.521 2.527 2.527 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                  </svg>
                )}
                {isLoading ? 'Redirecting to Slack...' : 'Continue with Slack'}
              </button>

              <button
                disabled
                className="w-full px-6 py-4 rounded-xl bg-secondary/50 text-muted-foreground font-medium cursor-not-allowed flex items-center justify-center gap-3 relative"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
                <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                  Soon
                </span>
              </button>
            </div>

            <div className="mt-8 p-4 bg-secondary/50 rounded-xl">
              <p className="text-xs text-center text-muted-foreground">
                We use Slack OAuth for secure authentication. By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Don't have an account?{' '}
              <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
                Contact Sales
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
