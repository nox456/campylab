'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BeakerIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isRegister
        ? await register(email, password)
        : await login(email, password);
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('Error al iniciar sesion. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--background)',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'var(--primary)',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <BeakerIcon style={{ width: '36px', height: '36px', color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--foreground)' }}>
            CampyLab
          </h1>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
            Sistema de Gestion de Laboratorio
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', textAlign: 'center' }}>
            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesion'}
          </h2>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="email">
                Correo Electronico
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="Ingrese su correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="password">
                Contrasena
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-input"
                  style={{ paddingRight: '2.5rem' }}
                  placeholder="Ingrese su contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted-foreground)',
                    padding: '0.25rem',
                  }}
                >
                  {showPassword ? (
                    <EyeSlashIcon style={{ width: '20px', height: '20px' }} />
                  ) : (
                    <EyeIcon style={{ width: '20px', height: '20px' }} />
                  )}
                </button>
              </div>
              {isRegister && (
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                  Minimo 8 caracteres
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ padding: '0.75rem' }}
            >
              {loading ? (isRegister ? 'Registrando...' : 'Ingresando...') : (isRegister ? 'Registrarse' : 'Ingresar')}
            </button>
          </form>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              {isRegister ? 'Ya tengo cuenta' : 'Crear cuenta nueva'}
            </button>
          </div>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: '0.8125rem',
          color: 'var(--muted-foreground)'
        }}>
          &copy; 2025 CampyLab. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
