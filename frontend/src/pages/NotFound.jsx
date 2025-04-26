import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  // Automatically redirect to home page after 5 seconds
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      navigate("/");
    }, 5000);

    // Clean up timer if component unmounts
    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-6xl font-bold text-blue-600 mb-6">404</h1>
      <h2 className="text-3xl font-semibold text-gray-800 mb-4">
        Page Not Found
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <p className="text-md text-gray-500 mb-6">
        You will be redirected to the home page in 5 seconds...
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Return to Home Page
      </Link>
    </div>
  );
};

export default NotFound;
