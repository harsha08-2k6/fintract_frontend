import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Income } from './pages/Income';
import { Expenses } from './pages/Expenses';
import { AddExpense } from './pages/AddExpense';
import { Categories } from './pages/Categories';
import { Analytics } from './pages/Analytics';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { Goals } from './pages/Goals';
import { NotFound } from './pages/NotFound';

const pagePaths = {
  dashboard: '/dashboard',
  transactions: '/transactions',
  income: '/income',
  expenses: '/expenses',
  'add-expense': '/expenses/new',
  categories: '/categories',
  analytics: '/analytics',
  reports: '/reports',
  goals: '/goals',
  settings: '/settings',
  profile: '/profile'
};

const pathPages = Object.entries(pagePaths).reduce((pages, [page, path]) => {
  pages[path] = page;
  return pages;
}, { '/': 'dashboard' });

const getPageFromLocation = () => pathPages[window.location.pathname] || 'not-found';

const getInitialAuthView = () => {
  const path = window.location.pathname;
  if (path === '/reset-password') return 'reset-password';
  if (path === '/forgot-password') return 'forgot-password';
  if (path === '/register') return 'register';
  return 'login';
};

function MainLayout() {
  const { isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState(getPageFromLocation);
  const [authView, setAuthView] = useState(getInitialAuthView);
  const [expenseFilters, setExpenseFilters] = useState({ categoryId: '', startDate: '', endDate: '' });

  useEffect(() => {
    const handlePopState = () => {
      setActivePage(getPageFromLocation());
      setAuthView(getInitialAuthView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (page, filterParams = null) => {
    const nextPath = pagePaths[page] || '/dashboard';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    if (filterParams && page === 'expenses') {
      setExpenseFilters(filterParams);
    }
    setActivePage(page);
  };

  const navigateToAuth = (view) => {
    const targetPath = view === 'reset-password' ? '/reset-password' :
                       view === 'forgot-password' ? '/forgot-password' :
                       view === 'register' ? '/register' : '/login';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setAuthView(view);
  };

  if (!isAuthenticated) {
    if (authView === 'reset-password' || window.location.pathname === '/reset-password') {
      return (
        <ResetPassword
          onNavigateLogin={() => navigateToAuth('login')}
          onNavigateForgotPassword={() => navigateToAuth('forgot-password')}
        />
      );
    }
    if (authView === 'forgot-password' || window.location.pathname === '/forgot-password') {
      return (
        <ForgotPassword
          onNavigateLogin={() => navigateToAuth('login')}
        />
      );
    }
    if (authView === 'register') {
      return (
        <Register
          onNavigateLogin={() => navigateToAuth('login')}
          onSuccess={() => navigate('dashboard')}
        />
      );
    }
    return (
      <Login
        onNavigateRegister={() => navigateToAuth('register')}
        onNavigateForgotPassword={() => navigateToAuth('forgot-password')}
        onSuccess={() => navigate('dashboard')}
      />
    );
  }

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigateExpenses={() => navigate('transactions')}
            onNavigateIncome={() => navigate('income')}
            onNavigateAddExpense={() => navigate('add-expense')}
            onNavigateCategories={() => navigate('categories')}
          />
        );
      case 'transactions':
        return (
          <Transactions
            onNavigateAddExpense={() => navigate('add-expense')}
            onNavigateIncome={() => navigate('income')}
          />
        );
      case 'income':
        return <Income />;
      case 'expenses':
        return (
          <Expenses
            onNavigateAddExpense={() => navigate('add-expense')}
            initialCategory={expenseFilters.categoryId}
            initialStartDate={expenseFilters.startDate}
            initialEndDate={expenseFilters.endDate}
          />
        );
      case 'add-expense':
        return (
          <AddExpense
            onSuccess={() => navigate('expenses')}
            onCancel={() => navigate('expenses')}
            onNavigateCategories={() => navigate('categories')}
          />
        );
      case 'categories':
        return (
          <Categories
            onNavigateExpenses={(categoryId, startDate, endDate) => {
              navigate('expenses', { categoryId, startDate, endDate });
            }}
          />
        );
      case 'analytics':
        return <Analytics />;
      case 'reports':
        return <Reports />;
      case 'goals':
        return <Goals />;
      case 'settings':
      case 'profile':
        return <Profile />;
      case 'not-found':
        return <NotFound onNavigate={navigate} />;
      default:
        return <NotFound onNavigate={navigate} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={navigate} />
      <main className="main-content">
        <Navbar
          activePage={activePage}
          onAddExpenseClick={() => navigate('add-expense')}
          onNavigate={navigate}
          alertsCount={1}
        />
        <ProtectedRoute onNavigateLogin={() => navigate('dashboard')}>
          {renderContent()}
        </ProtectedRoute>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
