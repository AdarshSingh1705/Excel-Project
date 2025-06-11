import React, { useEffect, useRef, useState } from 'react';
import { Star, ArrowLeft, ArrowRight, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TestimonialProps {
  content: string;
  author: string;
  role: string;
  company: string;
  rating: number;
  image: string;
}

const testimonials: TestimonialProps[] = [
  {
    content: "ExcelAnalytics transformed how we handle our quarterly sales reports. What used to take hours now takes minutes, and the visualizations are incredibly insightful.",
    author: "Sarah Johnson",
    role: "Finance Director",
    company: "Global Retail Inc.",
    rating: 5,
    image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150"
  },
  {
    content: "As a data analyst, I've tried many tools, but none compare to the ease and power of ExcelAnalytics. The ability to quickly transform Excel data into interactive charts is game-changing.",
    author: "Michael Chen",
    role: "Data Scientist",
    company: "Tech Innovations",
    rating: 5,
    image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150"
  },
  {
    content: "Our research team relies on ExcelAnalytics daily. The platform saves us countless hours and helps us communicate our findings more effectively with stakeholders.",
    author: "Emily Rodriguez",
    role: "Research Lead",
    company: "Pharma Solutions",
    rating: 4,
    image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150"
  },
  {
    content: "The customer support team is exceptional. When we had questions about integrating the platform with our existing systems, they guided us through every step.",
    author: "David Park",
    role: "IT Manager",
    company: "Manufacturing Excellence",
    rating: 5,
    image: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150"
  }
];

const Testimonials: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? 80 : -80,
      opacity: 0,
      scale: 0.96,
      filter: 'blur(2px)'
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        x: { type: 'spring', stiffness: 120, damping: 18 },
        opacity: { duration: 0.35 },
        scale: { duration: 0.35 },
        filter: { duration: 0.35 }
      }
    },
    exit: (direction: 'left' | 'right') => ({
      zIndex: 0,
      x: direction === 'left' ? 80 : -80,
      opacity: 0,
      scale: 0.96,
      filter: 'blur(2px)',
      transition: {
        x: { type: 'spring', stiffness: 120, damping: 18 },
        opacity: { duration: 0.35 },
        scale: { duration: 0.35 },
        filter: { duration: 0.35 }
      }
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: 'left' | 'right') => {
    setDirection(newDirection);
    setActiveIndex((prev) => {
      if (newDirection === 'right') {
        return prev === testimonials.length - 1 ? 0 : prev + 1;
      }
      return prev === 0 ? testimonials.length - 1 : prev - 1;
    });
  };

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

  useEffect(() => {
    const interval = setInterval(() => {
      paginate('right');
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="py-16 md:py-24 opacity-0 transition-opacity duration-1000"
    >
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            What Our Users Say
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg">
            Hear from professionals who have transformed their Excel data analysis
          </p>
        </motion.div>
        
        <div className="relative max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute -top-6 left-12 opacity-70 text-indigo-600 dark:text-indigo-400"
          >
            <Quote className="w-16 h-16" />
          </motion.div>
          
          <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-xl p-8 md:p-12 border border-gray-100 dark:border-gray-700">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);
                  if (swipe < -swipeConfidenceThreshold) {
                    paginate("right");
                  } else if (swipe > swipeConfidenceThreshold) {
                    paginate("left");
                  }
                }}
                className="relative p-8 md:p-12"
                transition={{
                  x: { type: 'spring', stiffness: 120, damping: 18 },
                  opacity: { duration: 0.35 },
                  scale: { duration: 0.35 },
                  filter: { duration: 0.35 }
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-8">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="md:w-1/4 flex flex-col items-center"
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-indigo-200 dark:border-indigo-700">
                      <motion.img 
                        src={testimonials[activeIndex].image}
                        alt={testimonials[activeIndex].author}
                        className="w-full h-full object-cover"
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex mb-2"
                    >
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          className={`w-5 h-5 ${
                            i < testimonials[activeIndex].rating 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="md:w-3/4"
                  >
                    <p className="text-gray-700 dark:text-gray-300 text-lg mb-6 italic">
                      "{testimonials[activeIndex].content}"
                    </p>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {testimonials[activeIndex].author}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        {testimonials[activeIndex].role}, {testimonials[activeIndex].company}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => {
                  setDirection(index > activeIndex ? 'right' : 'left');
                  setActiveIndex(index);
                }}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  index === activeIndex 
                    ? 'bg-indigo-600 dark:bg-indigo-400' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => paginate("left")}
            className="absolute top-1/2 -translate-y-1/2 -left-5 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 focus:outline-none"
            aria-label="Previous testimonial"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => paginate("right")}
            className="absolute top-1/2 -translate-y-1/2 -right-5 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 focus:outline-none"
            aria-label="Next testimonial"
          >
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;