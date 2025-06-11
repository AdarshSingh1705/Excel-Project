import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  toggleOpen: () => void;
  index: number;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, toggleOpen, index }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }, index * 100);
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
  }, [index]);

  return (
    <div 
      ref={itemRef}
      className="border-b border-gray-200 dark:border-gray-700 py-5 opacity-0 translate-y-8 transition-all duration-500"
    >
      <button
        onClick={toggleOpen}
        className="flex justify-between items-center w-full text-left focus:outline-none"
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{question}</h3>
        <span className="ml-6 flex-shrink-0 text-indigo-600 dark:text-indigo-400">
          {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </span>
      </button>
      <div 
        className={`mt-3 transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-gray-600 dark:text-gray-400">{answer}</p>
      </div>
    </div>
  );
};

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const faqs = [
    {
      question: "What file formats does ExcelAnalytics support?",
      answer: "ExcelAnalytics supports all Microsoft Excel file formats, including .xls, .xlsx, and .xlsm. You can also import CSV files and Google Sheets exports."
    },
    {
      question: "How secure is my data on your platform?",
      answer: "We take data security extremely seriously. All files are encrypted at rest and in transit. We use enterprise-grade security measures to protect your data, and we never share or sell your information with third parties. You can delete your data at any time."
    },
    {
      question: "Can I collaborate with my team on analyses?",
      answer: "Yes! Our Enterprise plan includes team collaboration features that allow multiple team members to work on the same datasets, share visualizations, and comment on results. You can control access permissions for each team member."
    },
    {
      question: "What types of charts and visualizations can I create?",
      answer: "ExcelAnalytics supports a wide range of visualizations, including bar charts, line charts, pie charts, scatter plots, area charts, bubble charts, heat maps, and more. Our Pro and Enterprise plans also include 3D visualizations and advanced customization options."
    },
    {
      question: "How does the AI-powered insights feature work?",
      answer: "Our AI technology automatically analyzes your data to identify trends, correlations, and outliers. It can suggest the most appropriate visualization types for your data and provide written insights that explain key findings in plain language. This helps you discover valuable patterns that might otherwise be missed."
    },
    {
      question: "Is there a limit to how much data I can upload?",
      answer: "The Basic plan limits you to 5 Excel file uploads per month with a maximum file size of 10MB each. The Pro plan allows unlimited uploads with a maximum file size of 50MB each. The Enterprise plan supports unlimited uploads with files up to 500MB each."
    }
  ];
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100');
          entry.target.classList.remove('opacity-0');
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
      id="faq" 
      ref={sectionRef}
      className="py-16 md:py-24 opacity-0 transition-opacity duration-1000"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg">
            Get answers to common questions about ExcelAnalytics
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <FAQItem 
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              toggleOpen={() => setOpenIndex(openIndex === index ? -1 : index)}
              index={index}
            />
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Still have questions? Contact our support team.
          </p>
          <a 
            href="#contact" 
            className="inline-flex items-center px-6 py-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors duration-300 font-medium"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;