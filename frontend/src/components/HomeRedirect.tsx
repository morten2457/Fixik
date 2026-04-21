import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useAuth';

const HomeRedirect = () => {
  const user = useCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'operator') {
    return <Navigate to="/operator" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default HomeRedirect;