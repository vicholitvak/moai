
'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

const Footer = () => {
  const { user, role } = useAuth();

  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
        <div>
          <h3 className="font-bold text-lg mb-4">LicanÑam</h3>
          <p className="text-gray-400">Fresh, local homemade meals delivered to your door.</p>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-4">Navigate</h3>
          <ul>
            <li><Link href="/about" className="hover:text-atacama-orange transition-colors">About Us</Link></li>
            <li><Link href="/faq" className="hover:text-atacama-orange transition-colors">FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-atacama-orange transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-4">Get Involved</h3>
          <ul>
            <li><Link href="/signup/cook" className="hover:text-atacama-orange transition-colors">Become a Cooker</Link></li>
            <li><Link href="/signup/driver" className="hover:text-atacama-orange transition-colors">Become a Driver</Link></li>
            {user && role === 'Cooker' && (
              <li><Link href="/cooker/dashboard" className="hover:text-atacama-orange transition-colors">Dashboard</Link></li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-4">Legal</h3>
          <ul>
            <li><Link href="/privacy" className="hover:text-atacama-orange transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-atacama-orange transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto text-center mt-8 border-t border-gray-700 pt-6">
        <p>&copy; 2025 LicanÑam. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
