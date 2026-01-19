import { AuthProvider } from './context/AuthContext';
import Router from './router/Router';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
