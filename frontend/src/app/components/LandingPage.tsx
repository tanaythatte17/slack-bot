import { useNavigate } from 'react-router';
import {
  Sparkles,
  Zap,
  Shield,
  RefreshCw,
  Search,
  Link2,
  Lock,
  CheckCircle2,
  ArrowRight,
  Database,
  MessageSquare,
  FileText,
  Github
} from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-background/50 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="size-5 text-white" />
            </div>
            <span className="font-semibold text-lg">slackbotfyi</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            <a href="#security" className="text-muted-foreground hover:text-foreground transition-colors">Security</a>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                <Sparkles className="size-4 text-purple-400" />
                <span className="text-sm text-purple-300">Powered by Gemini</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-semibold mb-6 leading-tight">
                Your Company Knowledge,{' '}
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Instantly Searchable
                </span>{' '}
                in Slack
              </h1>

              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Connect Notion and Slack to let your team ask questions and receive instant AI-powered answers from internal documentation.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <button
                  onClick={() => navigate('/auth')}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  Get Started with Slack
                  <ArrowRight className="size-5" />
                </button>
                <button className="px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors">
                  View Demo
                </button>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-500" />
                  <span>Secure OAuth Authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-500" />
                  <span>Private Workspace Data</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-3xl rounded-full" />
              <div className="relative bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-2xl">
                {/* Slack Chat Mockup */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-border">
                    <div className="size-8 rounded bg-gradient-to-br from-purple-500 to-pink-500" />
                    <div>
                      <div className="font-medium">#general</div>
                      <div className="text-xs text-muted-foreground">3 members</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="size-8 rounded bg-blue-500/20 flex items-center justify-center text-sm">JD</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">John Doe</span>
                          <span className="text-xs text-muted-foreground">10:34 AM</span>
                        </div>
                        <div className="text-sm">What's our leave policy?</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="size-8 rounded bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Sparkles className="size-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">slackbotfyi</span>
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Bot</span>
                          <span className="text-xs text-muted-foreground">10:34 AM</span>
                        </div>
                        <div className="text-sm bg-secondary/50 rounded-lg p-3">
                          <p className="mb-2">Employees receive <strong>20 paid leave days</strong> annually. Leave requests should be submitted at least 2 weeks in advance through the HR portal.</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                            <FileText className="size-3" />
                            <span>Source: HR Policy Guide · Notion</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Logos */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-4 -right-4 size-12 rounded-xl bg-white shadow-lg flex items-center justify-center"
                >
                  <svg className="size-8" viewBox="0 0 24 24" fill="none">
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
                  </svg>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute -bottom-4 -left-4 size-12 rounded-xl bg-white shadow-lg flex items-center justify-center"
                >
                  <svg className="size-8" viewBox="0 0 100 100" fill="none">
                    <path d="M50 0L61.8 38.2H100L69.1 61.8L80.9 100L50 76.4L19.1 100L30.9 61.8L0 38.2H38.2L50 0Z" fill="black"/>
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground">Everything you need to unlock your company's knowledge</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Link2, title: 'Connect Slack in Seconds', desc: 'One-click OAuth integration with your Slack workspace' },
              { icon: RefreshCw, title: 'Auto-Sync Notion Pages', desc: 'Automatically index and update your Notion documentation' },
              { icon: Search, title: 'AI Semantic Search', desc: 'Advanced embeddings for accurate context-aware answers' },
              { icon: FileText, title: 'Source-Linked Answers', desc: 'Every response includes citations to original documents' },
              { icon: Database, title: 'Multi-Workspace Support', desc: 'Manage multiple teams and workspaces from one place' },
              { icon: Zap, title: 'Fast Retrieval Pipeline', desc: 'Sub-second query processing with pgvector' },
              { icon: Shield, title: 'Secure OAuth Integrations', desc: 'Enterprise-grade security with OAuth 2.0' },
              { icon: MessageSquare, title: 'Real-Time Indexing', desc: 'See sync status and indexing progress in real-time' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl p-6 hover:border-purple-500/50 transition-colors"
              >
                <div className="size-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="size-6 text-purple-400" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Get started in minutes, not hours</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Connect Slack & Notion', desc: 'Authenticate with OAuth and select which Notion pages to sync', icon: Link2 },
              { step: '02', title: 'Sync and Embed Documents', desc: 'We automatically chunk, embed, and index your documentation', icon: Database },
              { step: '03', title: 'Ask Questions in Slack', desc: 'Your team gets instant AI answers with source citations', icon: MessageSquare },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <div className="size-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="size-8 text-white" />
                  </div>
                  <div className="text-sm text-purple-400 mb-2">STEP {step.step}</div>
                  <h3 className="font-semibold mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8">
                    <ArrowRight className="size-6 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Chat Section */}
      <section className="py-20 px-6 bg-secondary/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4">See It In Action</h2>
            <p className="text-xl text-muted-foreground">Real conversations, real answers</p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "What's the leave policy?",
                answer: "Employees receive 20 paid leave days annually. Leave requests should be submitted at least 2 weeks in advance through the HR portal.",
                source: "HR Policy Guide"
              },
              {
                question: "How do we deploy services?",
                answer: "Services are deployed using our CI/CD pipeline. Push to main triggers automated tests, then staging deployment. Production requires manual approval via GitHub Actions.",
                source: "Engineering Runbook"
              },
            ].map((chat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex gap-3 mb-4">
                  <div className="size-8 rounded bg-blue-500/20 flex items-center justify-center text-sm">U</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1">User</div>
                    <div className="text-sm">{chat.question}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="size-8 rounded bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Sparkles className="size-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1">slackbotfyi</div>
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <p className="text-sm mb-3">{chat.answer}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                        <FileText className="size-3" />
                        <span>Source: {chat.source} · Notion</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex size-16 rounded-full bg-green-500/10 items-center justify-center mb-4">
              <Shield className="size-8 text-green-400" />
            </div>
            <h2 className="text-4xl font-semibold mb-4">Enterprise-Grade Security</h2>
            <p className="text-xl text-muted-foreground">Your data security is our top priority</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Lock, title: 'End-to-End Workspace Isolation', desc: 'Each workspace is completely isolated with dedicated embeddings and access controls' },
              { icon: Shield, title: 'OAuth 2.0 Authentication', desc: 'Secure token-based authentication with automatic refresh and revocation support' },
              { icon: Database, title: 'Vector Search with pgvector', desc: 'Industry-standard PostgreSQL extension for fast, secure embedding storage' },
              { icon: CheckCircle2, title: 'Private Embeddings', desc: 'Your documents are processed in isolated environments with encrypted storage' },
              { icon: Lock, title: 'No Training on Customer Data', desc: 'We never use your data to train AI models. Your knowledge stays private.' },
              { icon: Shield, title: 'SOC 2 Compliant Infrastructure', desc: 'Hosted on secure, compliant infrastructure with regular audits' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex gap-4 bg-card border border-border rounded-xl p-6"
              >
                <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="size-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-12"
          >
            <h2 className="text-4xl md:text-5xl font-semibold mb-6">
              Turn Company Docs Into Instant Answers
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join teams already using slackbotfyi to unlock their knowledge
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-4 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              Connect Your Workspace
              <ArrowRight className="size-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Sparkles className="size-5 text-white" />
                </div>
                <span className="font-semibold text-lg">slackbotfyi</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered knowledge assistant for modern teams
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#security" className="hover:text-foreground transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 slackbotfyi. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="size-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
