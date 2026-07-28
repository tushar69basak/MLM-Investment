import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Percent, 
  LogOut, 
  LayoutDashboard, 
  History, 
  GitFork, 
  ShieldAlert, 
  PlusCircle, 
  Play, 
  RotateCcw, 
  ChevronRight,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Share2,
  Calendar,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Predefined Plans
const PLANS = {
  Basic: { name: 'Basic', rate: 1.0, duration: 100, desc: 'Starter Plan' },
  Premium: { name: 'Premium', rate: 1.5, duration: 120, desc: 'Recommended Plan' },
  VIP: { name: 'VIP', rate: 2.0, duration: 150, desc: 'High-Yield Elite Plan' }
};

export default function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [isRegister, setIsRegister] = useState(false);

  // Forms state
  const [authForm, setAuthForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    referralCode: '' // referredBy code
  });

  // App navigation
  const [page, setPage] = useState('dashboard'); // dashboard, investments, earnings, referrals

  // UI state
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState(null);
  const [directReferrals, setDirectReferrals] = useState([]);
  const [referralTree, setReferralTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sandbox simulation forms
  const [depositAmount, setDepositAmount] = useState('500');
  const [simDate, setSimDate] = useState(new Date().toISOString().split('T')[0]);

  // Razorpay Gateway State
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [razorpayMethod, setRazorpayMethod] = useState('qr');
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  // Admin Dashboard State
  const [adminData, setAdminData] = useState(null);
  const [adminTab, setAdminTab] = useState('users');
  const [adminLoading, setAdminLoading] = useState(false);

  // Investment Modal Form
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [investPlan, setInvestPlan] = useState('Basic');
  const [investAmount, setInvestAmount] = useState('100');

  // Load user profile on token change
  useEffect(() => {
    setError('');
    setSuccess('');
    if (token) {
      localStorage.setItem('token', token);
      fetchProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  // Periodic statistics refresh
  useEffect(() => {
    if (user) {
      loadDashboardData();
      if (page === 'referrals') {
        loadReferralsData();
      }
    }
  }, [user, page]);

  // Helper: Request Headers
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // API Call: Fetch User Profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        if (data.data.role === 'admin') {
          setPage('admin');
        }
      } else {
        // Token expired/invalid
        setToken('');
      }
    } catch (err) {
      console.error(err);
      setToken('');
    } finally {
      setLoading(false);
    }
  };

  // API Call: Load stats and histories
  const loadDashboardData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data.stats);
        setLogs(data.data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Load referral lists and visual tree
  const loadReferralsData = async () => {
    try {
      const directRes = await fetch(`${API_BASE_URL}/referrals/direct`, {
        headers: getHeaders()
      });
      const directData = await directRes.json();
      if (directData.success) {
        setDirectReferrals(directData.data);
      }

      const treeRes = await fetch(`${API_BASE_URL}/referrals/tree`, {
        headers: getHeaders()
      });
      const treeData = await treeRes.json();
      if (treeData.success) {
        setReferralTree(treeData.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Fetch Admin panel statistics and directories
  const loadAdminData = async () => {
    try {
      setAdminLoading(true);
      setError('');
      const res = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setAdminData(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch admin stats');
    } finally {
      setAdminLoading(false);
    }
  };

  // Action: Suspend or Activate user (Admin only)
  const handleToggleUserStatus = async (userId) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/toggle-user-status/${userId}`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        loadAdminData(); // Refresh directories
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to toggle user status');
    }
  };

  // Trigger admin loader when navigating to admin page
  useEffect(() => {
    if (user && page === 'admin' && user.role === 'admin') {
      loadAdminData();
    }
  }, [user, page]);

  // Action: Register User
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Registration successful!');
        setToken(data.data.token);
        setUser(data.data);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Server connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // Action: Login User
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Logged in successfully!');
        setToken(data.data.token);
        setUser(data.data);
        if (data.data.role === 'admin') {
          setPage('admin');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Server connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // Action: Simulate Wallet Deposit
  const handleDeposit = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/investments/deposit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount: depositAmount })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        setDepositAmount('500');
        loadDashboardData();
        fetchProfile();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to process sandbox deposit.');
    }
  };

  // Action: Purchase Investment Plan
  const handlePurchase = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/investments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount: investAmount,
          planName: investPlan
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        setIsInvestModalOpen(false);
        setInvestAmount('100');
        setInvestPlan('Basic');
        loadDashboardData();
        fetchProfile();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to process investment purchase.');
    }
  };

  // Action: Trigger Daily ROI Cron simulation
  const handleTriggerCron = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/trigger-roi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: simDate })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(
          `Simulated Day successfully. Processed: ${data.data.processedCount}, Idempotency Skipped: ${data.data.skippedCount}`
        );
        loadDashboardData();
        fetchProfile();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to trigger daily cron distribution.');
    }
  };

  // Action: Reset Sandbox
  const handleResetSandbox = async () => {
    if (!window.confirm('Are you sure you want to reset all sandbox investments, histories, and balances?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/reset-sandbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        loadDashboardData();
        fetchProfile();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to reset sandbox.');
    }
  };

  // Action: Logout
  const handleLogout = () => {
    // Reset auth token and user profile
    setToken('');
    setUser(null);
    
    // Reset main statistics and logs
    setStats(null);
    setLogs(null);
    setDirectReferrals([]);
    setReferralTree([]);
    setPage('dashboard');
    
    // Reset UI notifications
    setError('');
    setSuccess('');
    
    // Reset login/register forms
    setAuthForm({
      email: '',
      password: '',
      fullName: '',
      mobileNumber: '',
      referralCode: ''
    });
    
    // Reset Sandbox simulation states
    setDepositAmount('500');
    setSimDate(new Date().toISOString().split('T')[0]);
    
    // Reset Razorpay gateway states
    setIsRazorpayModalOpen(false);
    setRazorpayMethod('qr');
    setCardNumber('4111 1111 1111 1111');
    setCardExpiry('12/28');
    setCardCvv('123');
    
    // Reset Admin states
    setAdminData(null);
    setAdminTab('users');
    setAdminLoading(false);
    
    // Reset Investment modal states
    setIsInvestModalOpen(false);
    setInvestPlan('Basic');
    setInvestAmount('100');
  };

  // Recursive Tree Node Renderer for Referral tree
  const ReferralNode = ({ node }) => {
    return (
      <li className="tree-node">
        <div className={`node-content level-${node.level}`}>
          <div className="node-avatar">{node.level}</div>
          <div className="node-info">
            <span className="node-name">{node.fullName}</span>
            <span className="node-meta">{node.email} • Code: {node.referralCode}</span>
            <span className="node-balance">Balance: ${node.walletBalance.toFixed(2)}</span>
          </div>
        </div>
        {node.referrals && node.referrals.length > 0 && (
          <ul className="tree-children">
            {node.referrals.map((child) => (
              <ReferralNode key={child._id} node={child} />
            ))}
          </ul>
        )}
      </li>
    );
  };

  // Helper: Format Dates
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper: Prepare Chart Data (group by date)
  const prepareChartData = () => {
    if (!logs) return [];
    
    // Group earnings by date
    const dailyMap = {};

    logs.roiHistory.forEach(log => {
      const d = log.date.slice(0, 10);
      dailyMap[d] = dailyMap[d] || { date: d, ROI: 0, Level: 0 };
      dailyMap[d].ROI += log.amount;
    });

    logs.referralIncomeHistory.forEach(log => {
      const d = log.date.slice(0, 10);
      dailyMap[d] = dailyMap[d] || { date: d, ROI: 0, Level: 0 };
      dailyMap[d].Level += log.amount;
    });

    // Sort by date key ascending
    return Object.values(dailyMap)
      .sort((a, b) => new String(a.date).localeCompare(b.date))
      .map(item => ({
        ...item,
        date: formatDate(item.date),
        Total: Number((item.ROI + item.Level).toFixed(2)),
        ROI: Number(item.ROI.toFixed(2)),
        Level: Number(item.Level.toFixed(2))
      }))
      .slice(-7); // show last 7 active days
  };

  const chartData = prepareChartData();

  // RENDER AUTH PAGE
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card glass-card">
          <div className="auth-header">
            <div className="logo-container">
              <TrendingUp className="logo-icon" />
              <span className="logo-text">NEXACHAIN AI</span>
            </div>
            <p className="auth-subtitle">
              {isRegister ? 'Create an investment portal account' : 'Access your referral & ROI panel'}
            </p>
          </div>

          {error && <div className="alert alert-error"><ShieldAlert size={16} />{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={isRegister ? handleRegister : handleLogin}>
            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-container">
                    <UserIcon className="input-icon" />
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      placeholder="Jane Doe"
                      value={authForm.fullName}
                      onChange={e => setAuthForm({ ...authForm, fullName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <div className="input-container">
                    <Phone className="input-icon" />
                    <input 
                      type="tel" 
                      className="form-input" 
                      required 
                      placeholder="+91 9876543210"
                      value={authForm.mobileNumber}
                      onChange={e => setAuthForm({ ...authForm, mobileNumber: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-container">
                <Mail className="input-icon" />
                <input 
                  type="email" 
                  className="form-input" 
                  required 
                  placeholder="jane@example.com"
                  value={authForm.email}
                  onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-container">
                <Lock className="input-icon" />
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                />
              </div>
            </div>

            {isRegister && (
              <div className="form-group">
                <label className="form-label">Referral Code (Optional)</label>
                <div className="input-container">
                  <Share2 className="input-icon" />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="NEXAXXXX"
                    value={authForm.referralCode}
                    onChange={e => setAuthForm({ ...authForm, referralCode: e.target.value })}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="auth-footer">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <span 
              className="auth-link" 
              onClick={() => {
                setError('');
                setIsRegister(!isRegister);
              }}
            >
              {isRegister ? 'Sign In' : 'Sign Up'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // RENDER MAIN APPLICATION DASHBOARD
  return (
    <div className="dashboard-wrapper">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-container">
            <TrendingUp className="logo-icon" />
            <span className="logo-text">NEXACHAIN</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {user && user.role === 'admin' ? (
            <>
              <div 
                className={`nav-item ${page === 'admin' && adminTab === 'users' ? 'active' : ''}`}
                onClick={() => { setPage('admin'); setAdminTab('users'); }}
                style={{ color: 'var(--accent-yellow)', borderColor: (page === 'admin' && adminTab === 'users') ? 'rgba(245, 158, 11, 0.2)' : '', background: (page === 'admin' && adminTab === 'users') ? 'rgba(245, 158, 11, 0.05)' : '' }}
              >
                <Users size={20} />
                <span>Affiliates Directory</span>
              </div>
              <div 
                className={`nav-item ${page === 'admin' && adminTab === 'investments' ? 'active' : ''}`}
                onClick={() => { setPage('admin'); setAdminTab('investments'); }}
                style={{ color: 'var(--accent-blue)', borderColor: (page === 'admin' && adminTab === 'investments') ? 'rgba(59, 130, 246, 0.2)' : '', background: (page === 'admin' && adminTab === 'investments') ? 'rgba(59, 130, 246, 0.05)' : '' }}
              >
                <TrendingUp size={20} />
                <span>Capital Investments</span>
              </div>
              <div 
                className={`nav-item ${page === 'admin' && adminTab === 'logs' ? 'active' : ''}`}
                onClick={() => { setPage('admin'); setAdminTab('logs'); }}
                style={{ color: 'var(--accent-cyan)', borderColor: (page === 'admin' && adminTab === 'logs') ? 'rgba(6, 182, 212, 0.2)' : '', background: (page === 'admin' && adminTab === 'logs') ? 'rgba(6, 182, 212, 0.05)' : '' }}
              >
                <History size={20} />
                <span>Ledger Audit Logs</span>
              </div>
              <div 
                className={`nav-item ${page === 'admin' && adminTab === 'controls' ? 'active' : ''}`}
                onClick={() => { setPage('admin'); setAdminTab('controls'); }}
                style={{ color: 'var(--accent-red)', borderColor: (page === 'admin' && adminTab === 'controls') ? 'rgba(239, 68, 68, 0.2)' : '', background: (page === 'admin' && adminTab === 'controls') ? 'rgba(239, 68, 68, 0.05)' : '' }}
              >
                <ShieldAlert size={20} />
                <span>System Yield Controls</span>
              </div>
            </>
          ) : (
            <>
              <div 
                className={`nav-item ${page === 'dashboard' ? 'active' : ''}`}
                onClick={() => setPage('dashboard')}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </div>
              <div 
                className={`nav-item ${page === 'investments' ? 'active' : ''}`}
                onClick={() => setPage('investments')}
              >
                <PlusCircle size={20} />
                <span>My Investments</span>
              </div>
              <div 
                className={`nav-item ${page === 'earnings' ? 'active' : ''}`}
                onClick={() => setPage('earnings')}
              >
                <History size={20} />
                <span>Earnings Log</span>
              </div>
              <div 
                className={`nav-item ${page === 'referrals' ? 'active' : ''}`}
                onClick={() => setPage('referrals')}
              >
                <GitFork size={20} />
                <span>Referral Network</span>
              </div>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user.fullName}</span>
            <span className="user-email">{user.email}</span>
            <span className="user-email" style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>
              Ref Code: {user.referralCode}
            </span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="dashboard-header">
          <div className="welcome-section">
            <h1>
              {page === 'dashboard' && 'Dashboard Overview'}
              {page === 'investments' && 'Investment Portfolio'}
              {page === 'earnings' && 'Earnings History'}
              {page === 'referrals' && 'Referral Tree Hierarchy'}
              {page === 'admin' && adminTab === 'users' && 'Affiliates Directory'}
              {page === 'admin' && adminTab === 'investments' && 'Capital Investments'}
              {page === 'admin' && adminTab === 'logs' && 'Ledger Audit Logs'}
              {page === 'admin' && adminTab === 'controls' && 'System Yield Controls'}
            </h1>
            <p>
              {page === 'dashboard' && `Welcome back, ${user.fullName}. Monitor and grow your returns.`}
              {page === 'investments' && 'View your active contracts, interest returns, and maturity schedules.'}
              {page === 'earnings' && 'Track historical daily interest credits and multi-level referral commissions.'}
              {page === 'referrals' && 'Inspect your 3-level affiliate network tree and direct commissions.'}
              {page === 'admin' && adminTab === 'users' && 'Manage system affiliate members and their account statuses.'}
              {page === 'admin' && adminTab === 'investments' && 'Inspect all active, completed, and matured capital contracts.'}
              {page === 'admin' && adminTab === 'logs' && 'Audit transaction records for daily ROI yields and network commissions.'}
              {page === 'admin' && adminTab === 'controls' && 'Simulate target date periods and trigger global yield distributions.'}
            </p>
          </div>
          
          {user && user.role !== 'admin' && (
            <div className="quick-actions">
              <button className="btn-secondary" onClick={() => setIsInvestModalOpen(true)}>
                <PlusCircle size={18} />
                New Investment
              </button>
            </div>
          )}
        </header>

        {error && <div className="alert alert-error" style={{ marginBottom: 24 }}><ShieldAlert size={16} />{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 24 }}>{success}</div>}

        {/* --- PAGE: DASHBOARD --- */}
        {page === 'dashboard' && (
          <>
            {/* Stats Dashboard Cards */}
            <div className="stats-grid">
              <div className="stat-card glass-card yellow">
                <div className="stat-header">
                  <span className="stat-title">Wallet Balance</span>
                  <div className="stat-icon-wrapper">
                    <DollarSign size={20} />
                  </div>
                </div>
                <div className="stat-value">${stats ? stats.walletBalance.toFixed(2) : '0.00'}</div>
                <div className="stat-desc">Ready to invest or withdraw</div>
              </div>

              <div className="stat-card glass-card blue">
                <div className="stat-header">
                  <span className="stat-title">Total Investments</span>
                  <div className="stat-icon-wrapper">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <div className="stat-value">${stats ? stats.totalInvestments.toFixed(2) : '0.00'}</div>
                <div className="stat-desc">Cumulative principal active</div>
              </div>

              <div className="stat-card glass-card green">
                <div className="stat-header">
                  <span className="stat-title">Daily ROI Yield</span>
                  <div className="stat-icon-wrapper">
                    <Percent size={20} />
                  </div>
                </div>
                <div className="stat-value">${stats ? stats.dailyRoiRate.toFixed(2) : '0.00'} / day</div>
                <div className="stat-desc">Projected ROI returns</div>
              </div>

              <div className="stat-card glass-card cyan">
                <div className="stat-header">
                  <span className="stat-title">Level Referral Income</span>
                  <div className="stat-icon-wrapper">
                    <Users size={20} />
                  </div>
                </div>
                <div className="stat-value">${stats ? stats.totalLevelIncomeEarned.toFixed(2) : '0.00'}</div>
                <div className="stat-desc">Total network commission</div>
              </div>
            </div>

            {/* Recharts Chart and Testing Simulator Panel */}
            <div className="charts-grid">
              {/* Earnings line chart */}
              <div className="chart-panel glass-card">
                <div className="panel-header">
                  <h3 className="panel-title">Earnings Performance (Last 7 Days)</h3>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer>
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} />
                        <Tooltip contentStyle={{ background: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
                        <Area type="monotone" dataKey="ROI" stroke="var(--accent-green)" fillOpacity={1} fill="url(#colorRoi)" strokeWidth={2} name="Daily ROI ($)" />
                        <Area type="monotone" dataKey="Level" stroke="var(--accent-cyan)" fillOpacity={1} fill="url(#colorLevel)" strokeWidth={2} name="Level Commission ($)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state">No earnings history logged yet. Buy a plan and simulate some days!</div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Section: Active Packages and Quick Deposit */}
            <div className="dashboard-bottom-grid">
              {/* List active investments summary */}
              <div className="glass-card" style={{ padding: 24 }}>
                <div className="panel-header">
                  <h3 className="panel-title">Active Packages Summary</h3>
                </div>
                <div className="table-wrapper">
                  {logs && logs.investments.length > 0 ? (
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Plan Name</th>
                          <th>Amount</th>
                          <th>Daily Rate</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.investments.slice(0, 5).map(inv => (
                          <tr key={inv._id}>
                            <td style={{ fontWeight: 'bold' }}>{inv.planName}</td>
                            <td>${inv.amount.toFixed(2)}</td>
                            <td style={{ color: 'var(--accent-green)' }}>{inv.dailyRoiPercentage}%</td>
                            <td>{formatDate(inv.startDate)}</td>
                            <td>{formatDate(inv.endDate)}</td>
                            <td>
                              <span className={`badge badge-${inv.status.toLowerCase()}`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">No investments created yet. Click "New Investment" to purchase a plan!</div>
                  )}
                </div>
              </div>

              {/* Deposit Card */}
              <div className="simulator-panel glass-card" style={{ height: '100%' }}>
                <div className="panel-header">
                  <h3 className="panel-title">Quick Wallet Deposit</h3>
                </div>
                <div className="simulator-group" style={{ border: 'none', padding: 0 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 15 }}>
                    Enter an amount and deposit funds immediately to your wallet using the Razorpay payment gateway simulation.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Deposit Amount ($)</label>
                      <input 
                        type="number" 
                        className="sim-input" 
                        style={{ width: '100%', padding: '10px 12px' }}
                        value={depositAmount} 
                        onChange={e => setDepositAmount(e.target.value)}
                      />
                    </div>
                    <button className="btn-action yellow" style={{ width: '100%', padding: '10px 12px', justifyContent: 'center' }} onClick={() => setIsRazorpayModalOpen(true)}>
                      Pay with Razorpay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- PAGE: INVESTMENTS --- */}
        {page === 'investments' && (
          <div className="glass-card" style={{ padding: 30 }}>
            <div className="panel-header" style={{ marginBottom: 30 }}>
              <h3 className="panel-title">Your Investment History</h3>
              <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setIsInvestModalOpen(true)}>
                + New Investment
              </button>
            </div>
            
            <div className="table-wrapper">
              {logs && logs.investments.length > 0 ? (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Plan Details</th>
                      <th>Principal Amount</th>
                      <th>Daily Yield</th>
                      <th>Start Date</th>
                      <th>Maturity Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.investments.map(inv => (
                      <tr key={inv._id}>
                        <td>
                          <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{inv.planName} Plan</div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {inv._id}</span>
                        </td>
                        <td style={{ fontSize: '1rem', fontWeight: 600 }}>${inv.amount.toFixed(2)}</td>
                        <td style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{inv.dailyRoiPercentage}%</td>
                        <td>{formatDate(inv.startDate)}</td>
                        <td>{formatDate(inv.endDate)}</td>
                        <td>
                          <span className={`badge badge-${inv.status.toLowerCase()}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">You have not created any investments. Click "+ New Investment" to start earning.</div>
              )}
            </div>
          </div>
        )}

        {/* --- PAGE: EARNINGS LOG --- */}
        {page === 'earnings' && (
          <div className="history-section">
            {/* ROI Earnings Log */}
            <div className="glass-card" style={{ padding: 30 }}>
              <h3 className="panel-title" style={{ marginBottom: 20 }}>Daily ROI Earnings History</h3>
              <div className="table-wrapper">
                {logs && logs.roiHistory.length > 0 ? (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date Received</th>
                        <th>Investment ID</th>
                        <th>ROI Received</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.roiHistory.map(log => (
                        <tr key={log._id}>
                          <td>{formatDate(log.date)}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.investment}</td>
                          <td style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '0.95rem' }}>
                            +${log.amount.toFixed(2)}
                          </td>
                          <td>
                            <span className="badge badge-active">{log.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">No ROI earnings records found. Trigger the daily cron to credit ROI!</div>
                )}
              </div>
            </div>

            {/* Level Commission Log */}
            <div className="glass-card" style={{ padding: 30 }}>
              <h3 className="panel-title" style={{ marginBottom: 20 }}>Referral Level Income History</h3>
              <div className="table-wrapper">
                {logs && logs.referralIncomeHistory.length > 0 ? (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date Received</th>
                        <th>Source Affiliate</th>
                        <th>Level</th>
                        <th>Rate Applied</th>
                        <th>Commission Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.referralIncomeHistory.map(log => {
                        const rates = { 1: '10%', 2: '5%', 3: '3%' };
                        return (
                          <tr key={log._id}>
                            <td>{formatDate(log.date)}</td>
                            <td>
                              <div style={{ fontWeight: 'bold' }}>{log.referrer ? log.referrer.fullName : 'Deleted User'}</div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {log.referrer ? log.referrer.email : ''}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 'bold', color: 'white' }}>Lvl {log.level}</span>
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>{rates[log.level] || ''}</td>
                            <td style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', fontSize: '0.95rem' }}>
                              +${log.amount.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">No referral network commissions earned yet. Invite users and run cron yields!</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- PAGE: REFERRAL NETWORK --- */}
        {page === 'referrals' && (
          <div className="history-section">
            {/* Visual multi-level tree */}
            <div className="glass-card" style={{ padding: 30 }}>
              <h3 className="panel-title" style={{ marginBottom: 20 }}>MLM Referral Hierarchy Tree (Up to 3 Levels)</h3>
              <div className="referral-tree-container">
                {referralTree.length > 0 ? (
                  <ul className="tree-list">
                    {referralTree.map((child) => (
                      <ReferralNode key={child._id} node={child} />
                    ))}
                  </ul>
                ) : (
                  <div className="empty-state">Your referral tree is empty. Share your referral code to invite others!</div>
                )}
              </div>
            </div>

            {/* Direct referrals table */}
            <div className="glass-card" style={{ padding: 30 }}>
              <h3 className="panel-title" style={{ marginBottom: 20 }}>Immediate Level 1 Referrals</h3>
              <div className="table-wrapper">
                {directReferrals.length > 0 ? (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Affiliate Name</th>
                        <th>Email & Mobile</th>
                        <th>Wallet Balance</th>
                        <th>ROI Earned</th>
                        <th>Network Income</th>
                        <th>Joined Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {directReferrals.map(refUser => (
                        <tr key={refUser._id}>
                          <td style={{ fontWeight: 'bold' }}>{refUser.fullName}</td>
                          <td>
                            <div>{refUser.email}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{refUser.mobileNumber}</div>
                          </td>
                          <td style={{ fontWeight: 600 }}>${refUser.walletBalance.toFixed(2)}</td>
                          <td>${refUser.totalRoiEarned.toFixed(2)}</td>
                          <td>${refUser.totalLevelIncomeEarned.toFixed(2)}</td>
                          <td>{formatDate(refUser.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">You have no direct affiliates. Share your code to link partners.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {page === 'admin' && user && user.role === 'admin' && (
          <div className="history-section">
            {/* Admin Stats Dashboard Grid */}
            {adminData && (
              <div className="stats-grid">
                <div className="stat-card glass-card yellow" style={{ borderLeft: '4px solid var(--accent-yellow)' }}>
                  <div className="stat-header">
                    <span className="stat-title">Total Affiliates</span>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-yellow)' }}>
                      <Users size={20} />
                    </div>
                  </div>
                  <div className="stat-value">{adminData.stats.totalUsers}</div>
                  <div className="stat-desc">Registered network members</div>
                </div>

                <div className="stat-card glass-card blue" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
                  <div className="stat-header">
                    <span className="stat-title">Total Invested</span>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)' }}>
                      <DollarSign size={20} />
                    </div>
                  </div>
                  <div className="stat-value">${adminData.stats.totalPrincipal.toFixed(2)}</div>
                  <div className="stat-desc">Total cumulative capital pool</div>
                </div>

                <div className="stat-card glass-card green" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                  <div className="stat-header">
                    <span className="stat-title">Total Active Capital</span>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)' }}>
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <div className="stat-value">${adminData.stats.totalActivePrincipal.toFixed(2)}</div>
                  <div className="stat-desc">Current yield-generating capital</div>
                </div>

                <div className="stat-card glass-card cyan" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                  <div className="stat-header">
                    <span className="stat-title">Total ROI Distributed</span>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)' }}>
                      <Percent size={20} />
                    </div>
                  </div>
                  <div className="stat-value">${adminData.stats.totalRoiPaid.toFixed(2)}</div>
                  <div className="stat-desc">Total interest paid to affiliates</div>
                </div>

                <div className="stat-card glass-card purple" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
                  <div className="stat-header">
                    <span className="stat-title">Total Commissions Paid</span>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)' }}>
                      <Users size={20} />
                    </div>
                  </div>
                  <div className="stat-value">${adminData.stats.totalCommissionsPaid.toFixed(2)}</div>
                  <div className="stat-desc">Total level bonus commissions</div>
                </div>
              </div>
            )}

            {/* Admin Data Directory Cards */}
            <div className="glass-card" style={{ padding: 30 }}>

              {adminLoading && <div className="loading-spinner">Loading admin directory...</div>}

              {!adminLoading && adminData && (
                <>
                  {/* TAB: Affiliates Management */}
                  {adminTab === 'users' && (
                    <div className="table-wrapper">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Affiliate Info</th>
                            <th>Mobile</th>
                            <th>Wallet Balance</th>
                            <th>ROI Earned</th>
                            <th>Referral Income</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminData.users.map(u => (
                            <tr key={u._id}>
                              <td>
                                <div style={{ fontWeight: 'bold' }}>{u.fullName}</div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email} • Code: {u.referralCode}</span>
                              </td>
                              <td>{u.mobileNumber}</td>
                              <td style={{ fontWeight: 600 }}>${u.walletBalance.toFixed(2)}</td>
                              <td>${u.totalRoiEarned.toFixed(2)}</td>
                              <td>${u.totalLevelIncomeEarned.toFixed(2)}</td>
                              <td>
                                <span className={`badge badge-${u.accountStatus === 'Active' ? 'active' : 'cancelled'}`}>
                                  {u.accountStatus}
                                </span>
                              </td>
                              <td>
                                <button 
                                  className={`btn-action ${u.accountStatus === 'Active' ? 'danger' : 'green'}`}
                                  style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '4px' }}
                                  onClick={() => handleToggleUserStatus(u._id)}
                                >
                                  {u.accountStatus === 'Active' ? 'Suspend' : 'Activate'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* TAB: All Investments */}
                  {adminTab === 'investments' && (
                    <div className="table-wrapper">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Owner</th>
                            <th>Plan Details</th>
                            <th>Principal Amount</th>
                            <th>Daily Rate</th>
                            <th>Duration (Dates)</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminData.investments.map(inv => (
                            <tr key={inv._id}>
                              <td>
                                <div style={{ fontWeight: 'bold' }}>{inv.user ? inv.user.fullName : 'Deleted User'}</div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inv.user ? inv.user.email : ''}</span>
                              </td>
                              <td>
                                <div style={{ fontWeight: 'bold' }}>{inv.planName} Plan</div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {inv._id}</span>
                              </td>
                              <td style={{ fontWeight: 600 }}>${inv.amount.toFixed(2)}</td>
                              <td style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{inv.dailyRoiPercentage}%</td>
                              <td>
                                <div style={{ fontSize: '0.85rem' }}>Start: {formatDate(inv.startDate)}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>End: {formatDate(inv.endDate)}</div>
                              </td>
                              <td>
                                <span className={`badge badge-${inv.status.toLowerCase()}`}>
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* TAB: Yield & Commissions Logs */}
                  {adminTab === 'logs' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                      <div>
                        <h4 style={{ marginBottom: 12, fontSize: '1rem', color: 'var(--text-secondary)' }}>System ROI Yield Credits</h4>
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>User Name / Email</th>
                              <th>Investment ID</th>
                              <th>ROI Paid</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminData.roiLogs.map(log => (
                              <tr key={log._id}>
                                <td>{formatDate(log.date)}</td>
                                <td>
                                  <div style={{ fontWeight: 'bold' }}>{log.user ? log.user.fullName : 'Deleted User'}</div>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.user ? log.user.email : ''}</span>
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>{log.investment ? log.investment._id : log.investment}</td>
                                <td style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>+${log.amount.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <h4 style={{ marginBottom: 12, fontSize: '1rem', color: 'var(--text-secondary)' }}>System MLM Level Commissions</h4>
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Recipient (Sponsor)</th>
                              <th>Source (Child)</th>
                              <th>Level</th>
                              <th>Commission Paid</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminData.referralIncomes.map(log => (
                              <tr key={log._id}>
                                <td>{formatDate(log.date)}</td>
                                <td>
                                  <div style={{ fontWeight: 'bold' }}>{log.recipient ? log.recipient.fullName : 'Deleted User'}</div>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.recipient ? log.recipient.email : ''}</span>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 'bold' }}>{log.referrer ? log.referrer.fullName : 'Deleted User'}</div>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.referrer ? log.referrer.email : ''}</span>
                                </td>
                                <td>Lvl {log.level}</td>
                                <td style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>+${log.amount.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB: System Yield Controls */}
                  {adminTab === 'controls' && (
                    <div style={{ maxWidth: 500, margin: '0 auto', padding: '20px 0' }}>
                      <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <div className="panel-header" style={{ marginBottom: 16 }}>
                          <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-red)' }}>
                            <Calendar size={18} />
                            Simulate Day & Cron Trigger
                          </h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
                          Select a target date and trigger the daily MLM interest rates and parent commissions manually for all active contracts in the sandbox.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div className="form-group">
                            <label className="form-label">Simulation Target Date</label>
                            <input 
                              type="date" 
                              className="sim-input" 
                              style={{ width: '100%', padding: 12 }}
                              value={simDate} 
                              onChange={e => setSimDate(e.target.value)}
                            />
                          </div>
                          <button 
                            className="btn-action red" 
                            style={{ width: '100%', padding: 12, justifyContent: 'center' }} 
                            onClick={handleTriggerCron}
                          >
                            <Play size={16} style={{ marginRight: 8 }} />
                            Trigger Daily Yields Distribution
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* INVESTMENT MODAL DIALOG */}
      {isInvestModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card glass-card">
            <div className="modal-header">
              <h3 className="panel-title">Purchase Investment Plan</h3>
              <button className="btn-close" onClick={() => setIsInvestModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePurchase}>
              <div className="form-group">
                <label className="form-label">Available Wallet Balance</label>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-yellow)', marginBottom: 16 }}>
                  ${user.walletBalance.toFixed(2)}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Package Plan</label>
                <div className="plans-list">
                  {Object.values(PLANS).map(plan => (
                    <div 
                      key={plan.name}
                      className={`plan-option ${investPlan === plan.name ? 'selected' : ''}`}
                      onClick={() => setInvestPlan(plan.name)}
                    >
                      <div>
                        <div className="plan-name">{plan.name}</div>
                        <div className="plan-meta">{plan.desc}</div>
                      </div>
                      <div>
                        <div className="plan-rate">{plan.rate}% daily</div>
                        <div className="plan-duration">{plan.duration} days</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Investment Amount ($)</label>
                <input 
                  type="number" 
                  className="sim-input" 
                  style={{ width: '100%', padding: 12, fontSize: '1rem' }}
                  required
                  min="1"
                  value={investAmount}
                  onChange={e => setInvestAmount(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary"
                disabled={user.walletBalance < parseFloat(investAmount)}
              >
                {user.walletBalance < parseFloat(investAmount) ? 'Insufficient Wallet Balance' : 'Confirm Purchase'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RAZORPAY PAYMENT SIMULATION MODAL */}
      {isRazorpayModalOpen && (
        <div className="razorpay-overlay">
          <div className="razorpay-card">
            <div className="razorpay-header">
              <span className="razorpay-brand">Razorpay Secure</span>
              <span className="razorpay-secure-tag">Test Mode</span>
            </div>

            <div className="razorpay-body">
              <div className="razorpay-merchant">Nexachain AI Portal</div>
              <div className="razorpay-amount">${parseFloat(depositAmount || 0).toFixed(2)}</div>

              <div className="razorpay-tabs">
                <div 
                  className={`razorpay-tab ${razorpayMethod === 'qr' ? 'active' : ''}`}
                  onClick={() => setRazorpayMethod('qr')}
                >
                  UPI QR Code
                </div>
                <div 
                  className={`razorpay-tab ${razorpayMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setRazorpayMethod('card')}
                >
                  Card Payment
                </div>
              </div>

              <div className="razorpay-content">
                {razorpayMethod === 'qr' ? (
                  <>
                    <svg width="160" height="160" viewBox="0 0 29 29" style={{ background: '#fff', padding: 8, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <path d="M0,0 h7 v7 h-7 z M1,1 h5 v5 h-5 z M2,2 h3 v3 h-3 z" fill="#000" />
                      <path d="M22,0 h7 v7 h-7 z M23,1 h5 v5 h-5 z M24,2 h3 v3 h-3 z" fill="#000" />
                      <path d="M0,22 h7 v7 h-7 z M1,23 h5 v5 h-5 z M2,24 h3 v3 h-3 z" fill="#000" />
                      <path d="M9,0 h2 v2 h-2 z M13,0 h3 v1 h-3 z M18,0 h2 v3 h-2 z M9,4 h4 v1 h-4 z M15,3 h2 v2 h-2 z" fill="#000" />
                      <path d="M8,8 h3 v3 h-3 z M12,8 h5 v1 h-5 z M19,8 h3 v2 h-3 z M9,13 h2 v3 h-2 z M13,12 h4 v2 h-4 z" fill="#000" />
                      <path d="M25,9 h2 v4 h-2 z M24,15 h3 v2 h-3 z M22,19 h4 v2 h-4 z M10,20 h3 v3 h-3 z M15,22 h4 v2 h-4 z" fill="#000" />
                      <path d="M12,18 h2 v2 h-2 z M16,16 h4 v3 h-4 z M20,13 h2 v3 h-2 z" fill="#000" />
                    </svg>
                    <div className="razorpay-upi-title">Scan QR with GPay / PhonePe / Paytm</div>
                  </>
                ) : (
                  <div className="razorpay-card-form">
                    <div className="razorpay-input-group">
                      <label className="razorpay-label">Card Number</label>
                      <input 
                        type="text" 
                        className="razorpay-input" 
                        value={cardNumber} 
                        onChange={e => setCardNumber(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="razorpay-input-group">
                        <label className="razorpay-label">Expiry (MM/YY)</label>
                        <input 
                          type="text" 
                          className="razorpay-input" 
                          placeholder="12/28"
                          value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)}
                        />
                      </div>
                      <div className="razorpay-input-group">
                        <label className="razorpay-label">CVV</label>
                        <input 
                          type="password" 
                          className="razorpay-input" 
                          placeholder="123"
                          value={cardCvv} 
                          onChange={e => setCardCvv(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="razorpay-footer">
              <button 
                className="btn-razor-pay" 
                onClick={async () => {
                  setIsRazorpayModalOpen(false);
                  await handleDeposit();
                }}
              >
                Pay {depositAmount ? `$${parseFloat(depositAmount).toFixed(2)}` : 'with Razorpay'}
              </button>
              <button 
                className="btn-razor-cancel" 
                onClick={() => {
                  setIsRazorpayModalOpen(false);
                  setError('Payment cancelled by user.');
                }}
              >
                Cancel Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
