import React, { useEffect, useRef } from 'react';
import { 
  Upload, 
  BarChart4, 
  LineChart, 
  PieChart, 
  Download, 
  Users, 
  History, 
  ShieldCheck 
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          }, index * 100);
        }
      },
      {
        root: null,
        threshold: 0.1,
      }
    );
    
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    
    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [index]);

  return (
    <div 
      ref={cardRef}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl p-6 transition-all duration-500 border border-gray-100 dark:border-gray-700 opacity-0 translate-y-10 group"
    >
      <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
};

const Features: React.FC = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
        }
      },
      {
        root: null,
        threshold: 0.1,
      }
    );
    
    if (titleRef.current) {
      observer.observe(titleRef.current);
    }
    
    return () => {
      if (titleRef.current) {
        observer.unobserve(titleRef.current);
      }
    };
  }, []);

  const features = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: "Excel File Upload",
      description: "Seamlessly upload any Excel file (.xls or .xlsx) to our platform for instant analysis."
    },
    {
      icon: <BarChart4 className="w-6 h-6" />,
      title: "Data Visualization",
      description: "Transform your data into interactive 2D and 3D charts with just a few clicks."
    },
    {
      icon: <LineChart className="w-6 h-6" />,
      title: "Customizable Axes",
      description: "Select X and Y axes from your column headers to create the perfect visualization."
    },
    {
      icon: <PieChart className="w-6 h-6" />,
      title: "Multiple Chart Types",
      description: "Choose from various chart types including bar, line, pie, scatter, and more."
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: "Export Options",
      description: "Download your charts as PNG or PDF files for easy sharing and presentation."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "User Management",
      description: "Admin dashboard to manage users, permissions, and monitor platform usage."
    },
    {
      icon: <History className="w-6 h-6" />,
      title: "Upload History",
      description: "Access your past uploads and analyses anytime from your personalized dashboard."
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Secure Data Handling",
      description: "Enterprise-grade security ensures your data remains private and protected."
    }
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 -z-10"></div>
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 
            ref={titleRef}
            className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white opacity-0 translate-y-8 transition-all duration-700"
          >
            Powerful Excel Analytics Features
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg">
            Our platform offers everything you need to transform your Excel data into actionable insights
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;