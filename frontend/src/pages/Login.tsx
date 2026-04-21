// @ts-ignore
import JarvisMatrix from '../components/jarvis_matrix';
import LoginCard from '../components/LoginCard';

const Login = () => {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 3D фон J.A.R.V.I.S. */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <JarvisMatrix />
      </div>

      {/* Карточка входа */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backdropFilter: 'blur(8px)',
        }}
      >
        <LoginCard />
      </div>
    </div>
  );
};

export default Login;