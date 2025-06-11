import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import {
  ArrowRight,
  FileSpreadsheet,
  BarChart3,
  Lightbulb,
  DownloadCloud
} from 'lucide-react';

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
        }
      },
      { root: null, threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  const handleGetStarted = () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signin');
    }
  };

  return (
    <section className="pt-28 pb-16 md:pt-32 md:pb-24 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-gray-900 dark:to-indigo-950 -z-10"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-200 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-200 dark:bg-sky-900/20 rounded-full blur-3xl opacity-50 -z-10 animate-pulse delay-700"></div>

      <div
        ref={heroRef}
        className="container mx-auto px-4 flex flex-col md:flex-row items-center space-y-10 md:space-y-0 md:space-x-10 opacity-0 translate-y-10 transition-all duration-1000"
      >
        <div className="flex-1 max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
            Transform Excel Data Into{' '}
            <span className="text-indigo-600 dark:text-indigo-400">
              Powerful Insights
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8">
            Upload, analyze, and visualize your Excel data with our interactive platform.
            Generate beautiful charts and gain valuable insights in just a few clicks.
          </p>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleGetStarted}
              className="px-8 py-3 rounded-full bg-indigo-600 text-white text-lg font-medium hover:bg-indigo-700 transition-colors duration-300 transform hover:scale-105 flex items-center justify-center sm:justify-start gap-2 group"
            >
              Get Started
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <a
              href="#demo"
              className="px-8 py-3 rounded-full bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 text-lg font-medium border border-indigo-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-gray-600 transition-colors duration-300 flex items-center justify-center gap-2"
            >
              View Demo
            </a>
          </div>
        </div>

        <div className="flex-1 relative">
          <div className="relative w-full max-w-lg mx-auto">
            <div className="absolute inset-0 -m-8 bg-gradient-to-r from-indigo-500 to-sky-500 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden p-6 relative border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-semibold text-lg">Excel Analytics</h3>
                </div>
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500"></span>
                  <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                  <span className="h-3 w-3 rounded-full bg-green-500"></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-indigo-50 dark:bg-gray-700 p-4 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-2" />
                  <h4 className="font-medium">Interactive Charts</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Visualize your data instantly</p>
                </div>

                <div className="bg-indigo-50 dark:bg-gray-700 p-4 rounded-lg">
                  <Lightbulb className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-2" />
                  <h4 className="font-medium">AI Insights</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Discover hidden patterns</p>
                </div>

                <div className="bg-indigo-50 dark:bg-gray-700 p-4 rounded-lg">
                  <FileSpreadsheet className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-2" />
                  <h4 className="font-medium">Excel Compatible</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Works with all Excel files</p>
                </div>

                <div className="bg-indigo-50 dark:bg-gray-700 p-4 rounded-lg">
                  <DownloadCloud className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-2" />
                  <h4 className="font-medium">Export Options</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Download in multiple formats</p>
                </div>
              </div>

              <div className="animate-pulse">
                <div className="h-8 bg-indigo-100 dark:bg-gray-700 rounded-md mb-4"></div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-20 bg-indigo-100 dark:bg-gray-700 rounded-md"></div>
                  <div className="h-20 bg-indigo-100 dark:bg-gray-700 rounded-md"></div>
                  <div className="h-20 bg-indigo-100 dark:bg-gray-700 rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
