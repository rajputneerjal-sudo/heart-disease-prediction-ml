import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'What causes heart disease?', a: 'Heart disease is caused by a combination of factors including high blood pressure, high cholesterol, smoking, diabetes, obesity, physical inactivity, unhealthy diet, excessive alcohol, stress, and family history. Atherosclerosis (plaque buildup in arteries) is the most common underlying cause.' },
  { q: 'Can young people get heart disease?', a: 'Yes. While heart disease risk increases with age, young people can develop it too. Risk factors like obesity, high blood pressure, diabetes, smoking, and family history can cause heart disease in people in their 20s and 30s. Congenital heart defects are present from birth.' },
  { q: 'How accurate is the AI prediction?', a: 'Our AI model achieves approximately 94% accuracy on the Cleveland Heart Disease dataset using an ensemble of machine learning algorithms including Random Forest, Logistic Regression, SVM, and Decision Trees. However, this is a screening tool — not a medical diagnosis. Always consult a cardiologist for definitive evaluation.' },
  { q: 'Is high cholesterol dangerous?', a: 'High cholesterol (above 200 mg/dL) increases the risk of plaque buildup in arteries, which can lead to heart attack and stroke. LDL ("bad") cholesterol is particularly harmful, while HDL ("good") cholesterol is protective. Diet, exercise, and medication can help manage cholesterol levels.' },
  { q: 'What is the difference between a heart attack and cardiac arrest?', a: 'A heart attack occurs when blood flow to part of the heart is blocked, causing heart muscle damage. The heart usually keeps beating. Cardiac arrest is when the heart suddenly stops beating due to an electrical malfunction. Cardiac arrest is immediately life-threatening and requires CPR and defibrillation.' },
  { q: 'How often should I get my heart checked?', a: 'Adults should have blood pressure checked at least every 2 years, cholesterol every 4-6 years (more often if at risk), and blood sugar every 3 years after age 45. Those with risk factors should be screened more frequently. Annual check-ups are recommended for everyone over 40.' },
  { q: 'Can heart disease be reversed?', a: 'Some aspects of heart disease can be improved or partially reversed through aggressive lifestyle changes and medication. Studies show that a very low-fat plant-based diet, regular exercise, stress management, and smoking cessation can reduce arterial plaque. However, significant damage may be permanent.' },
  { q: 'What is the role of stress in heart disease?', a: 'Chronic stress raises cortisol and adrenaline levels, increasing blood pressure and heart rate. It can lead to unhealthy coping behaviors like overeating, smoking, and inactivity. Stress also promotes inflammation, which contributes to atherosclerosis. Managing stress is an important part of heart disease prevention.' },
  { q: 'Are women\'s heart disease symptoms different from men\'s?', a: 'Yes. While chest pain is common in both, women are more likely to experience atypical symptoms like nausea, jaw pain, back pain, extreme fatigue, and shortness of breath. These differences often lead to delayed diagnosis in women. Women should not dismiss these symptoms as unrelated to the heart.' },
  { q: 'What medications are used for heart disease?', a: 'Common medications include statins (lower cholesterol), ACE inhibitors and beta-blockers (lower blood pressure), aspirin (prevent clots), nitroglycerin (relieve angina), and anticoagulants (prevent blood clots). The specific medications depend on the type and severity of heart disease.' },
  { q: 'How does diabetes affect heart health?', a: 'Diabetes significantly increases heart disease risk — people with diabetes are 2-4 times more likely to develop cardiovascular disease. High blood sugar damages blood vessels and nerves, promotes inflammation, and accelerates atherosclerosis. Managing blood sugar is crucial for heart protection.' },
  { q: 'What is the Cleveland Heart Disease dataset?', a: 'The Cleveland Heart Disease dataset is a widely used medical dataset from the Cleveland Clinic Foundation, containing 303 patient records with 14 attributes including age, sex, chest pain type, blood pressure, cholesterol, and other cardiac measurements. It is the standard benchmark for heart disease prediction research.' },
];

const FAQItem = ({ faq, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between p-5 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="font-semibold text-gray-900 dark:text-white pr-4">{faq.q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-5 pb-5 bg-blue-50 dark:bg-blue-900/10 border-t border-gray-100 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed pt-4">{faq.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQPage = () => (
  <div className="space-y-6 max-w-3xl mx-auto">
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white"
    >
      <div className="flex items-center gap-3 mb-3">
        <HelpCircle className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
      </div>
      <p className="text-indigo-100 text-lg">
        Answers to common questions about heart disease, our AI prediction system, and cardiovascular health.
      </p>
    </motion.div>

    <div className="space-y-3">
      {faqs.map((faq, i) => <FAQItem key={i} faq={faq} index={i} />)}
    </div>

    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 text-center border border-blue-200 dark:border-blue-800">
      <p className="text-blue-800 dark:text-blue-300 font-medium">Have more questions?</p>
      <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">Consult with a qualified cardiologist for personalized medical advice.</p>
    </div>
  </div>
);

export default FAQPage;
