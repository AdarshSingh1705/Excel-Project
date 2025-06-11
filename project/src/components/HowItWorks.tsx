import React, { useEffect, useRef } from 'react';
import { Upload, BarChart2, Sliders, Download } from 'lucide-react';

interface StepCardProps {
  icon: React.ReactNode;
  number: number;
  title: string;
  description: string;
  isActive?: boolean;
}

const StepCard: React.FC<StepCardProps> = ({ icon, number, title, description, isActive = false }) => {
  return (
    <div className={`relative p-6 rounded-xl transition-all duration-500 ${
      isActive 
        ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800' 
        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
    }`}>
      <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
        {number}
      </div>
      <div className="pt-4">
        <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
};

const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = React.useState(1);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100');
          entry.target.classList.remove('opacity-0');
          
          // Start the step animation when section is visible
          const interval = setInterval(() => {
            setActiveStep(prev => prev < 4 ? prev + 1 : 1);
          }, 3000);
          
          return () => clearInterval(interval);
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
      id="how-it-works" 
      ref={sectionRef}
      className="py-16 md:py-24 opacity-0 transition-opacity duration-1000"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            How It Works
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg">
            Turn your Excel data into insights in just four simple steps
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connection lines between steps (only on larger screens) */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-indigo-200 dark:bg-indigo-800 -z-10 hidden lg:block"></div>
          
          <StepCard 
            icon={<Upload className="w-7 h-7" />}
            number={1}
            title="Upload Excel File"
            description="Simply drag and drop your Excel file onto our platform or use the file selector."
            isActive={activeStep === 1}
          />
          
          <StepCard 
            icon={<Sliders className="w-7 h-7" />}
            number={2}
            title="Select Parameters"
            description="Choose your X and Y axes from column headers and select your preferred chart type."
            isActive={activeStep === 2}
          />
          
          <StepCard 
            icon={<BarChart2 className="w-7 h-7" />}
            number={3}
            title="Generate Visualization"
            description="Our system instantly creates interactive charts based on your selections."
            isActive={activeStep === 3}
          />
          
          <StepCard 
            icon={<Download className="w-7 h-7" />}
            number={4}
            title="Export & Share"
            description="Download your visualizations as PNG/PDF or share them directly with your team."
            isActive={activeStep === 4}
          />
        </div>
        
        <div className="mt-16 text-center">
          <a 
            href="#demo" 
            className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors duration-300 text-lg font-medium"
          >
            See It In Action
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;