import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api, ApiError, type DocumentItem, type SSEEvent } from '@/lib/api';
import { NotionLogo, SlackLogo } from '@/app/components/BrandLogos';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Database,
  RefreshCw,
  Search,
  Settings,
  CreditCard,
  ChevronDown,
  User,
  Bell,
  Menu,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  ExternalLink,
  Send,
} from 'lucide-react';

export default function Dashboard() {
  const { session, startNotionAuth, startSlackBotAuth, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const notionConnected = session?.notionConnected ?? false;
  const slackConnected = session?.slackConnected ?? false;
  const [aiQuery, setAiQuery] = useState('');
  const [isConnectingNotion, setIsConnectingNotion] = useState(false);
  const [isConnectingSlack, setIsConnectingSlack] = useState(false);
  const [indexMessage, setIndexMessage] = useState<string | null>(null);
  const [indexedDocuments, setIndexedDocuments] = useState<number | null>(null);
  const [totalChunks, setTotalChunks] = useState<number | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchStats = async () => {
    try {
      const stats = await api.getWorkspaceStats();
      setIndexedDocuments(stats.indexedDocuments);
      setTotalChunks(stats.totalChunks);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load workspace stats';
      toast.error(message);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { documents: docs } = await api.getDocuments();
      setDocuments(docs);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load documents';
      toast.error(message);
    }
  };

  const formatCount = (value: number | null) =>
    value === null ? '—' : value.toLocaleString();

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
  ];

  const handleConnectNotion = async () => {
    setIsConnectingNotion(true);
    try {
      await startNotionAuth();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to start Notion connection';
      toast.error(message);
      setIsConnectingNotion(false);
    }
  };

  const handleConnectSlack = async () => {
    setIsConnectingSlack(true);
    try {
      await startSlackBotAuth();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to start Slack bot installation';
      toast.error(message);
      setIsConnectingSlack(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setIndexMessage(null);
    try {
      const result = await api.triggerNotionIndex();
      setIndexMessage(result.message);
      toast.success(result.message);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Indexing failed';
      toast.error(message);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    refreshSession();
    fetchStats();
    fetchDocuments();
  }, [refreshSession]);

  useEffect(() => {
    if (!session?.userId) return;

    const unsubscribe = api.subscribeToSyncEvents((event: SSEEvent) => {
      if (event.type === 'document') {
        setDocuments((prev) => {
          const existing = prev.find((doc) => doc.pageId === event.data.pageId);
          if (existing) {
            return prev.map((doc) =>
              doc.pageId === event.data.pageId ? event.data : doc
            );
          }
          return [...prev, event.data];
        });
      }

      if (event.type === 'syncStatus') {
        if (event.status === 'started') {
          setIsSyncing(true);
        }
        if (event.status === 'completed') {
          setIsSyncing(false);
          fetchStats();
          fetchDocuments();
          toast.success(event.message);
        }
        if (event.status === 'error') {
          setIsSyncing(false);
          toast.error(event.message);
        }
      }
    });

    return unsubscribe;
  }, [session?.userId]);

  const handleAiQuery = () => {
    if (!aiQuery.trim()) return;
    console.log('AI Query:', aiQuery);
    setAiQuery('');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } border-r border-border bg-sidebar transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="size-5 text-white" />
              </div>
              <span className="font-semibold">slackbotfyi</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            <Menu className="size-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <item.icon className="size-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-border">
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
              <h4 className="font-semibold text-sm mb-2">Upgrade to Pro</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Unlock unlimited documents and advanced features
              </p>
              <button className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="border-b border-border bg-card/50 backdrop-blur-xl">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-4 py-2 bg-secondary rounded-lg border border-transparent focus:border-purple-500/50 outline-none transition-colors"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors">
                <span className="text-sm">{session?.workspaceName ?? 'Workspace'}</span>
                <ChevronDown className="size-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-400">Synced</span>
              </div>

              <button className="p-2 hover:bg-secondary rounded-lg transition-colors relative">
                <Bell className="size-5" />
                <div className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500" />
              </button>

              <button className="flex items-center gap-2 px-3 py-2 hover:bg-secondary rounded-lg transition-colors">
                <div className="size-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <User className="size-4 text-white" />
                </div>
                <ChevronDown className="size-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome back! Workspace ID: {session?.workspaceId ?? '—'}
                </p>
                {indexMessage && (
                  <p className="text-sm text-green-400 mt-1">{indexMessage}</p>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Slack Bot',
                    value: slackConnected ? 'Connected' : 'Connect in Sources',
                    icon: MessageSquare,
                    color: 'from-purple-500 to-blue-500',
                  },
                  {
                    label: 'Notion Connection',
                    value: notionConnected ? 'Connected' : 'Connect in Sources',
                    icon: Database,
                    color: 'from-green-500 to-emerald-500',
                  },
                  {
                    label: 'Indexed Documents',
                    value: formatCount(indexedDocuments),
                    icon: FileText,
                    color: 'from-blue-500 to-cyan-500',
                  },
                  {
                    label: 'Total Chunks',
                    value: formatCount(totalChunks),
                    icon: Sparkles,
                    color: 'from-orange-500 to-red-500',
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-xl p-6 hover:border-purple-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`size-12 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-10 flex items-center justify-center`}
                      >
                        <stat.icon className="size-6 text-white" />
                      </div>
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        Active
                      </span>
                    </div>
                    <div className="text-2xl font-semibold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Two Column Layout */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Connected Sources */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Connected Sources</h2>
                    <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
                      Manage
                      <ExternalLink className="size-3" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                      <div className="size-12 rounded-lg bg-white flex items-center justify-center shrink-0">
                        <NotionLogo className="size-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium mb-1">Notion Workspace</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {notionConnected
                            ? `${session?.workspaceName ?? 'Workspace'} · ${formatCount(indexedDocuments)} pages synced`
                            : 'Connect to sync and index Notion pages'}
                        </div>
                      </div>
                      {notionConnected ? (
                        <div className="flex items-center gap-2 text-xs text-green-400 shrink-0">
                          <CheckCircle2 className="size-4" />
                          Connected
                        </div>
                      ) : (
                        <button
                          onClick={handleConnectNotion}
                          disabled={isConnectingNotion}
                          className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors disabled:opacity-50 shrink-0"
                        >
                          {isConnectingNotion ? 'Redirecting...' : 'Connect'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                      <div className="size-12 rounded-lg bg-[#4A154B] flex items-center justify-center shrink-0">
                        <SlackLogo className="size-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium mb-1">Slack Workspace</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {slackConnected
                            ? `${session?.workspaceName ?? 'Workspace'} · Bot installed`
                            : 'Install the bot to answer questions in Slack'}
                        </div>
                      </div>
                      {slackConnected ? (
                        <div className="flex items-center gap-2 text-xs text-green-400 shrink-0">
                          <CheckCircle2 className="size-4" />
                          Connected
                        </div>
                      ) : (
                        <button
                          onClick={handleConnectSlack}
                          disabled={isConnectingSlack}
                          className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors disabled:opacity-50 shrink-0"
                        >
                          {isConnectingSlack ? 'Redirecting...' : 'Connect'}
                        </button>
                      )}
                    </div>

                    <button className="w-full px-4 py-3 rounded-lg border border-dashed border-border hover:border-purple-500/50 hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground">
                      <Plus className="size-4" />
                      <span className="text-sm">Add More Sources</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Documents Table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Indexed Documents</h2>
                  <button
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
                  >
                    <RefreshCw className={`size-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Document Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {documents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-6 py-8 text-center text-sm text-muted-foreground"
                          >
                            {notionConnected
                              ? 'No documents indexed yet. Click Sync Now to start.'
                              : 'Connect Notion to index documents.'}
                          </td>
                        </tr>
                      ) : (
                        documents.map((doc) => (
                          <tr key={doc.pageId} className="hover:bg-secondary/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <FileText className="size-5 text-blue-400" />
                                <span className="font-medium">{doc.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {doc.status === 'completed' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                                  <CheckCircle2 className="size-3" />
                                  Completed
                                </span>
                              ) : doc.status === 'in_progress' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">
                                  <RefreshCw className="size-3 animate-spin" />
                                  In Progress
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">
                                  <XCircle className="size-3" />
                                  Failed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
