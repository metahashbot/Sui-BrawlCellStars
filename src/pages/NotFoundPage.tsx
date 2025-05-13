import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">404</h1>
        <p className="text-2xl font-semibold mb-6 text-gray-300">Page Not Found</p>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          The battle arena you're looking for doesn't exist in this dimension.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium flex items-center gap-2 mx-auto hover:opacity-90 transition-all"
        >
          <Home size={20} />
          Return to Homepage
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;