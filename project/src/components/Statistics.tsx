import React, { useState, useEffect, useRef } from 'react';
import { FileSpreadsheet, PieChart, Users, BarChart3 } from 'lucide-react';

interface StatItemProps {
  icon: React.ReactNode;
  startValue: number;
  endValue: number;
  label: string;
  suffix?: string;
  index: number;
}

const StatItem: React.FC<StatItemProps> = ({ icon, startValue, endValue, label, suffix = '', index }) => {
  const [value, setValue] = useState(startValue);
  const itemRef = useRef<HTMLDivElement>(null);
  const animationStarted = useRef(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animationStarted.current) {
          animationStarted.current = true;
          
          // Start with a delay based on index
          setTimeout(() => {
            const duration = 2000; // 2 seconds for the count animation
            const steps = 60; // 60 steps (for about 60fps for 1 second)
            const increment = (endValue - startValue) / steps;
            let currentStep = 0;
            
            const timer = setInterval(() => {
              currentStep++;
              setValue(prevValue => {
                const newValue = prevValue + increment;
                return currentStep >= steps ? endValue : newValue;
              });
              
              if (currentStep >= steps) {
                clearInterval(timer);
              }
            }, duration / steps);
          }, index * 200);
        }
      },
      {
        root: null,
        threshold: 0.1,
      }
    );
    
    if (itemRef.current) {
      observer.observe(itemRef.current);
    }
    
    return () => {
      if (itemRef.current) {
        observer.unobserve(itemRef.current);
      }
    };
  }, [startValue, endValue, index]);

  return (
    <div 
      ref={itemRef}
      className="flex flex-col items-center opacity-0 translate-y-8 transition-all duration-700"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
        {icon}
      </div>
      <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
        {Math.round(value)}{suffix}
      </div>
      <div className="text-gray-600 dark:text-gray-400 text-center">{label}</div>
    </div>
  );
};

const Statistics: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const elements = entry.target.querySelectorAll('.opacity-0');
          elements.forEach((el, index) => {
            setTimeout(() => {
              el.classList.add('opacity-100', 'translate-y-0');
              el.classList.remove('opacity-0', 'translate-y-8');
            }, index * 100);
          });
        }
      },
      {
        root: null,
        threshold: 0.1,
      }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="py-16 md:py-24 bg-indigo-50 dark:bg-gray-800 relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 -z-10"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-200 dark:bg-indigo-800/20 rounded-full blur-3xl opacity-50 -z-10"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-200 dark:bg-sky-800/20 rounded-full blur-3xl opacity-50 -z-10"></div>
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white opacity-0 translate-y-8 transition-all duration-700">
            Platform Statistics
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg opacity-0 translate-y-8 transition-all duration-700 delay-100">
            Trusted by professionals worldwide for Excel data analysis
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatItem 
            icon={<FileSpreadsheet className="w-8 h-8" />}
            startValue={0}
            endValue={500000}
            label="Excel Files Analyzed"
            suffix="+"
            index={0}
          />
          
          <StatItem 
            icon={<PieChart className="w-8 h-8" />}
            startValue={0}
            endValue={2500000}
            label="Charts Generated"
            suffix="+"
            index={1}
          />
          
          <StatItem 
            icon={<Users className="w-8 h-8" />}
            startValue={0}
            endValue={75000}
            label="Active Users"
            suffix="+"
            index={2}
          />
          
          <StatItem 
            icon={<BarChart3 className="w-8 h-8" />}
            startValue={0}
            endValue={99}
            label="User Satisfaction"
            suffix="%"
            index={3}
          />
        </div>
      </div>
    </section>
  );
};

export default Statistics;