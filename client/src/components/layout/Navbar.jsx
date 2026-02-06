import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  X,
  Bell,
  MessageCircle,
  User,
  LogOut,
  Building2,
  CircleDollarSign,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dashboard route based on role
  const dashboardRoute =
    user?.role === 'entrepreneur'
      ? '/dashboard/entrepreneur'
      : '/dashboard/investor';

  // Profile route
  const profileRoute = user
    ? `/profile/${user.role}/${user.id}`
    : '/login';

  const navLinks = [
    {
      icon:
        user?.role === 'entrepreneur' ? (
          <Building2 size={18} />
        ) : (
          <CircleDollarSign size={18} />
        ),
      text: 'Dashboard',
      path: dashboardRoute,
    },
    {
      icon: <MessageCircle size={18} />,
      text: 'Messages',
      path: user ? '/messages' : '/login',
    },
    {
      icon: <Bell size={18} />,
      text: 'Notifications',
      path: user ? '/notifications' : '/login',
    },
    {
      icon: <User size={18} />,
      text: 'Profile',
      path: profileRoute,
    },
  ];

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900">
                Business Nexus
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {navLinks.map((link, index) => (
                  <Link
                    key={index}
                    to={link.path}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition"
                  >
                    <span className="mr-2">{link.icon}</span>
                    {link.text}
                  </Link>
                ))}

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  leftIcon={<LogOut size={18} />}
                >
                  Logout
                </Button>

                <Link
                  to={profileRoute}
                  className="flex items-center space-x-2 ml-2"
                >
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    size="sm"
                    status={user.isOnline ? 'online' : 'offline'}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button>Sign up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user ? (
              <>
                <div className="flex items-center space-x-3 px-3 py-2">
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    size="sm"
                    status={user.isOnline ? 'online' : 'offline'}
                  />
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>

                {navLinks.map((link, index) => (
                  <Link
                    key={index}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center px-3 py-2 text-base text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    <span className="mr-3">{link.icon}</span>
                    {link.text}
                  </Link>
                ))}

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-2 text-base text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  <LogOut size={18} className="mr-3" />
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 px-3 py-2">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" fullWidth>
                    Log in
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                  <Button fullWidth>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
