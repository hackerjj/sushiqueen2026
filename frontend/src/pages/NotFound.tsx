import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-sushi-bg">
      <div className="text-center p-8 max-w-md mx-4">
        <div className="text-8xl font-bold text-sushi-primary mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Página no encontrada
        </h1>
        <p className="text-gray-500 mb-8 text-sm">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2 bg-sushi-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
