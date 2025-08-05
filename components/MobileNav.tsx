'use client';

import { useState } from 'react';
import { Menu, X, User, ShoppingCart, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

interface MobileNavProps {
  onSignInClick?: () => void;
  onSignUpClick?: () => void;
}

const MobileNav = ({ onSignInClick, onSignUpClick }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div 
            className="text-2xl font-bold text-atacama-orange cursor-pointer"
            onClick={() => handleNavigation('/')}
          >
            LicanÑam
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-100"
            onClick={toggleMenu}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="absolute top-[73px] right-0 left-0 bg-white shadow-lg border-t border-gray-200">
            <nav className="px-4 py-6 space-y-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-12 text-base font-medium"
                onClick={() => handleNavigation('/client/home')}
              >
                <MapPin className="mr-3 h-5 w-5 text-atacama-orange" />
                Explorar Comida
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-12 text-base font-medium"
                onClick={() => handleNavigation('/cart')}
              >
                <ShoppingCart className="mr-3 h-5 w-5 text-atacama-orange" />
                Mi Carrito
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-12 text-base font-medium"
                onClick={() => handleNavigation('/cooker/dashboard')}
              >
                <User className="mr-3 h-5 w-5 text-atacama-orange" />
                Para Cocineros
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-12 text-base font-medium"
                onClick={() => handleNavigation('/driver/dashboard')}
              >
                <User className="mr-3 h-5 w-5 text-atacama-orange" />
                Para Conductores
              </Button>
              
              <div className="border-t border-gray-200 pt-4 space-y-3">
                {onSignInClick && (
                  <Button
                    variant="outline"
                    className="w-full h-12 font-medium text-base"
                    onClick={() => {
                      onSignInClick();
                      setIsOpen(false);
                    }}
                  >
                    Iniciar Sesión
                  </Button>
                )}
                
                {onSignUpClick && (
                  <Button
                    className="w-full h-12 bg-atacama-orange hover:bg-atacama-orange/90 font-medium text-base"
                    onClick={() => {
                      onSignUpClick();
                      setIsOpen(false);
                    }}
                  >
                    Registrarse
                  </Button>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;