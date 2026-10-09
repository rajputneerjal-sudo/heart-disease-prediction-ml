import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Apple, Dumbbell, Moon, Droplets, Brain, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';

const sections = [
  {
    icon: Apple,
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    title: 'Heart-Healthy Eating',
    description: 'Your diet plays a crucial role in heart health. What you eat directly affects cholesterol levels, blood pressure, and inflammation.',
    tips: [
      'Eat plenty of fruits and vegetables (5+ servings daily)',
      'Choose whole grains over refined carbohydrates',
      'Include omega-3 rich foods: salmon, walnuts, flaxseeds',
      'Limit saturated fats, trans fats, and sodium',
      'Reduce processed and fast food consumption',
      'Use olive oil instead of butter for cooking',
      'Eat legumes and beans for plant-based protein',
    ],
  },
  {
    icon: Dumbbell,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    title: 'Exercise & Physical Activity',
    description: 'Regular physical activity strengthens your heart muscle, improves circulation, and helps maintain a healthy weight.',
    tips: [
      'Aim for 150 minutes of moderate aerobic exercise weekly',
      'Include strength training 2-3 times per week',
      'Take brisk 30-minute walks most days',
      'Try swimming, cycling, or dancing for cardio',
      'Take stairs instead of elevators when possible',
      'Break up long sitting periods with short walks',
      'Start slowly and gradually increase intensity',
    ],
  },
  {
    icon: Moon,
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    title: 'Quality Sleep',
    description: 'Sleep is when your heart rests and repairs. Poor sleep is linked to high blood pressure, obesity, and heart disease.',
    tips: [
      'Aim for 7-9 hours of quality sleep each night',
      'Maintain a consistent sleep schedule',
      'Create a cool, dark, quiet sleep environment',
      'Avoid screens 1 hour before bedtime',
      'Limit caffeine after 2 PM',
      'Treat sleep apnea — it strains the heart',
      'Avoid large meals close to bedtime',
    ],
  },
  {
    icon: Droplets,
    color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600',
    title: 'Hydration',
    description: 'Proper hydration helps your heart pump blood more efficiently and maintains healthy blood viscosity.',
    tips: [
      'Drink 8-10 glasses (2-2.5 liters) of water daily',
      'Increase intake during exercise and hot weather',
      'Monitor urine color — pale yellow is ideal',
      'Limit sugary drinks and sodas',
      'Herbal teas count toward daily fluid intake',
      'Eat water-rich foods like cucumbers and watermelon',
      'Avoid excessive alcohol which dehydrates',
    ],
  },
  {
    icon: Brain,
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
    title: 'Stress Management',
    description: 'Chronic stress raises blood pressure and cortisol levels, increasing heart disease risk significantly.',
    tips: [
      'Practice daily meditation or mindfulness (10-20 min)',
      'Try deep breathing exercises when stressed',
      'Engage in hobbies and activities you enjoy',
      'Maintain strong social connections',
      'Consider therapy or counseling if needed',
      'Practice yoga for combined physical and mental benefits',
      'Set healthy boundaries at work and in relationships',
    ],
  },
];

const HeartGuide = () => (
  <div className="space-y-6">
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="gradient-health rounded-2xl p-8 text-white"
    >
      <div className="flex items-center gap-3 mb-3">
        <Heart className="w-8 h-8 heartbeat" />
        <h1 className="text-3xl font-bold">Heart Health Guide</h1>
      </div>
      <p className="text-blue-100 text-lg max-w-2xl">
        Comprehensive guide to maintaining a healthy heart through lifestyle choices, diet, exercise, and stress management.
      </p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {sections.map((section, i) => {
        const Icon = section.icon;
        return (
          <motion.div key={section.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${section.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{section.title}</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{section.description}</p>
                <ul className="space-y-2">
                  {section.tips.map((tip, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>

    <Card>
      <CardContent className="pt-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🎯 Key Numbers to Know</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Blood Pressure', value: '<120/80', unit: 'mmHg', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' },
            { label: 'Cholesterol', value: '<200', unit: 'mg/dL', color: 'bg-green-50 dark:bg-green-900/20 border-green-200' },
            { label: 'Resting Heart Rate', value: '60-100', unit: 'bpm', color: 'bg-red-50 dark:bg-red-900/20 border-red-200' },
            { label: 'BMI', value: '18.5-24.9', unit: 'kg/m²', color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200' },
          ].map(item => (
            <div key={item.label} className={`rounded-xl p-4 border ${item.color}`}>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
              <p className="text-xs text-gray-400">{item.unit}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default HeartGuide;
