
'use client';

import { Button } from './ui/button';

const Hero = ({ onSignUpClick, onSignInClick }: { onSignUpClick: () => void, onSignInClick: () => void }) => {
  return (
    <div 
      className="relative bg-cover bg-center min-h-screen h-screen text-white flex flex-col items-center justify-center text-center transition-all duration-500"
      style={{ backgroundImage: `url(/valleluna.jpg)` }}
    >
      <div className="absolute inset-0 bg-black opacity-60"></div>
      <div
        className="relative z-10 px-4 max-w-4xl mx-auto"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 lg:mb-6 text-shadow-lg leading-tight">Alimentos frescos en el desierto.</h1>
        <p className="text-base sm:text-lg md:text-xl mb-6 md:mb-8 text-shadow-md max-w-2xl mx-auto leading-relaxed">Pide platos preparados por chefs en San Pedro de Atacama.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 px-4">
          <Button 
            onClick={onSignUpClick} 
            size="lg"
            className="bg-atacama-orange text-white font-bold py-4 px-8 rounded-full shadow-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 text-base sm:text-lg min-h-[48px] w-full sm:w-auto"
          >
            Registrarse
          </Button>
          <Button 
            onClick={onSignInClick} 
            variant="outline"
            size="lg"
            className="bg-atacama-brown/80 border-atacama-brown text-white font-bold py-4 px-8 rounded-full shadow-lg backdrop-blur-sm hover:bg-atacama-brown/90 transition-all duration-300 transform hover:scale-105 text-base sm:text-lg min-h-[48px] w-full sm:w-auto"
          >
            Iniciar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
