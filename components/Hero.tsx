
'use client';

import { Button } from './ui/button';

const Hero = ({ onSignUpClick, onSignInClick }: { onSignUpClick: () => void, onSignInClick: () => void }) => {
  return (
    <div 
      className="relative bg-cover bg-center h-screen text-white flex flex-col items-center justify-center text-center transition-all duration-500"
      style={{ backgroundImage: `url(/valleluna.jpg)` }}
    >
      <div className="absolute inset-0 bg-black opacity-60"></div>
      <div
        className="relative z-10 px-4"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-4 text-shadow-lg">Fresh, local homemade meals delivered to your door.</h1>
        <p className="text-lg md:text-xl mb-8 text-shadow-md">Discover authentic homemade meals from local cooks in your neighborhood.</p>
        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
          <Button 
            onClick={onSignUpClick} 
            size="lg"
            className="bg-moai-orange text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105"
          >
            Sign Up
          </Button>
          <Button 
            onClick={onSignInClick} 
            variant="outline"
            size="lg"
            className="bg-white/20 border-white/50 text-white font-bold py-3 px-6 rounded-full shadow-lg backdrop-blur-sm hover:bg-white/30 transition-all duration-300 transform hover:scale-105"
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
