import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../hooks/useAuth';
import { LogIn, User, Lock } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface LoginForm {
  email: string;
  password: string;
}

interface LoginCardProps {
  onSuccess?: () => void;
}

const LoginCard = ({ onSuccess }: LoginCardProps) => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsSubmitting(true);
      await login({
        username: data.email,
        password: data.password,
      });
      const user = useAuthStore.getState().user;
      if (user?.role === 'operator') {
        navigate('/operator', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      onSuccess?.();
    } catch (error: any) {
      setError('root', {
        message: 'Ошибка входа в систему',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '28rem',
        width: '100%',
        padding: '2rem',
        borderRadius: '1rem',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        border: '1px solid rgba(255, 215, 0, 0.4)',
        color: 'white',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            margin: '0 auto',
            width: '3rem',
            height: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 215, 0, 0.2)',
          }}
        >
          <LogIn style={{ width: '1.5rem', height: '1.5rem', color: '#FFD700' }} />
        </div>
        <h2 style={{ marginTop: '1rem', fontSize: '1.875rem', fontWeight: 'bold', color: 'white', textShadow: '0 0 4px black' }}>
          Вход в систему
        </h2>
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>
          Система управления ремонтно-монтажными заявками
        </p>
      </div>

      {/* Форма */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'white', marginBottom: '0.25rem' }}>
            Email адрес
          </label>
          <div style={{ position: 'relative', marginTop: '0.25rem' }}>
            <User style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', width: '1rem', height: '1rem', color: 'rgba(255,215,0,0.8)' }} />
            <input
              {...register('email', {
                required: 'Email обязателен',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Неверный формат email',
                },
              })}
              type="email"
              autoComplete="email"
              placeholder="Введите ваш email"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.5)',
                borderRadius: '0.375rem',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#FFD700')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,215,0,0.5)')}
            />
          </div>
          {errors.email && <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#f87171' }}>{errors.email.message}</p>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'white', marginBottom: '0.25rem' }}>
            Пароль
          </label>
          <div style={{ position: 'relative', marginTop: '0.25rem' }}>
            <Lock style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', width: '1rem', height: '1rem', color: 'rgba(255,215,0,0.8)' }} />
            <input
              {...register('password', {
                required: 'Пароль обязателен',
                minLength: {
                  value: 6,
                  message: 'Пароль должен содержать минимум 6 символов',
                },
              })}
              type="password"
              autoComplete="current-password"
              placeholder="Введите ваш пароль"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.5)',
                borderRadius: '0.375rem',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#FFD700')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,215,0,0.5)')}
            />
          </div>
          {errors.password && <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#f87171' }}>{errors.password.message}</p>}
        </div>

        {errors.root && (
          <div style={{ borderRadius: '0.375rem', backgroundColor: 'rgba(239,68,68,0.2)', border: '1px solid #f87171', padding: '0.75rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#fecaca' }}>{errors.root.message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '0.5rem 1rem',
            backgroundColor: '#D4AF37',
            color: '#1a1a1a',
            fontWeight: 600,
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#B8860B')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#D4AF37')}
        >
          {isSubmitting ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ marginRight: '0.5rem', display: 'inline-flex' }}>
                <LoadingSpinner size="sm" />
              </span>
              Вход...
            </span>
          ) : (
            'Войти'
          )}
        </button>
      </form>

      {/* Тестовые данные */}
      <div
        style={{
          marginTop: '1.5rem',
          padding: '1rem',
          borderRadius: '0.5rem',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
        }}
      >
        <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white', marginBottom: '0.5rem' }}>Тестовые учетные данные:</h3>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div><strong>Администратор:</strong> admin1@company.com / admin123</div>
          <div><strong>Исполнитель:</strong> executor1@company.com / exec123</div>
          <div><strong>Клиент:</strong> customer1@gmail.com / customer123</div>
          <div><strong>Оператор:</strong> operator@company.com / operator123</div>
        </div>
      </div>
    </div>
  );
};

export default LoginCard;