import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui/Toast';
import Router from './router/Router';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router />
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
