import React from 'react';
import { Github, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-6 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
              SUI Battle Arena
            </div>
            <p className="text-sm text-gray-400">
              AI-powered battle arena game built on SUI blockchain for the 2025 SUI Hackathon
            </p>
          </div>
          
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Github size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Twitter size={20} />
            </a>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} SUI Battle Arena. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;