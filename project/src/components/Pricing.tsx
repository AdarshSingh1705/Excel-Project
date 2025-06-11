import React, { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  highlighted?: boolean;
  buttonText: string;
}

const plans: PricingPlan[] = [
  {
    name: "Basic",
    price: "$0",
    period: "forever",
    description: "Perfect for individuals getting started with Excel analytics",
    features: [
      { text: "5 Excel file uploads per month", included: true },
      { text: "Basic chart types (bar, line, pie)", included: true },
      { text: "Export as PNG", included: true },
      { text: "7-day data retention", included: true },
      { text: "Community support", included: true },
      { text: "Advanced chart customization", included: false },
      { text: "AI-powered insights", included: false },
      { text: "Team collaboration", included: false },
    ],
    buttonText: "Start Free"
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For professionals who need more power and features",
    features: [
      { text: "Unlimited Excel file uploads", included: true },
      { text: "All chart types (including 3D)", included: true },
      { text: "Export as PNG and PDF", included: true },
      { text: "30-day data retention", included: true },
      { text: "Priority email support", included: true },
      { text: "Advanced chart customization", included: true },
      { text: "AI-powered insights", included: true },
      { text: "Team collaboration", included: false },
    ],
    highlighted: true,
    buttonText: "Get Started"
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "per month",
    description: "For teams and organizations with advanced needs",
    features: [
      { text: "Unlimited Excel file uploads", included: true },
      { text: "All chart types (including 3D)", included: true },
      { text: "Export in all formats", included: true },
      { text: "Unlimited data retention", included: true },
      { text: "24/7 priority support", included: true },
      { text: "Advanced chart customization", included: true },
      { text: "AI-powered insights", included: true },
      { text: "Team collaboration", included: true },
    ],
    buttonText: "Contact Sales"
  }
];

const Pricing: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100');
          entry.target.classList.remove('opacity-0');
          
          const cards = entry.target.querySelectorAll('.plan-card');
          cards.forEach((card, index) => {
            setTimeout(() => {
              card.classList.add('opacity-100', 'translate-y-0');
              card.classList.remove('opacity-0', 'translate-y-10');
            }, index * 200);
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
      id="pricing" 
      ref={sectionRef}
      className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900 opacity-0 transition-opacity duration-1000"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Choose the Right Plan for You
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg">
            Whether you're an individual analyst or an enterprise team, we have a plan that fits your needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`plan-card rounded-xl overflow-hidden transition-all duration-700 opacity-0 translate-y-10 ${
                plan.highlighted 
                  ? 'bg-white dark:bg-gray-800 shadow-xl border-2 border-indigo-500 dark:border-indigo-400 transform md:-translate-y-4 md:scale-105 relative' 
                  : 'bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-0 right-0 bg-indigo-500 text-white text-center py-1 text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">/{plan.period}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{plan.description}</p>
                
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`ml-2 ${feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
                
                <a 
                  href="#get-started" 
                  className={`block w-full py-3 rounded-lg text-center font-medium transition-colors duration-300 ${
                    plan.highlighted 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                  }`}
                >
                  {plan.buttonText}
                </a>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;