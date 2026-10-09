import React from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';

const tips = [
  { emoji: '🚶', title: 'Daily Walking', desc: 'Walk 10,000 steps daily. Even a 30-minute brisk walk reduces heart disease risk by 35%. Walking improves circulation, lowers blood pressure, and helps maintain healthy weight.', benefit: 'Reduces risk by 35%' },
  { emoji: '🧘', title: 'Yoga & Meditation', desc: 'Regular yoga practice reduces stress hormones, lowers blood pressure, and improves heart rate variability. Even 15 minutes daily makes a significant difference.', benefit: 'Lowers BP by 5-10 mmHg' },
  { emoji: '🥗', title: 'Mediterranean Diet', desc: 'The Mediterranean diet — rich in olive oil, fish, vegetables, and whole grains — is proven to reduce cardiovascular events by up to 30%.', benefit: 'Reduces events by 30%' },
  { emoji: '🚭', title: 'Quit Smoking', desc: 'Smoking is the #1 preventable cause of heart disease. Within 1 year of quitting, heart disease risk drops by 50%. Within 15 years, risk equals that of a non-smoker.', benefit: 'Risk halves in 1 year' },
  { emoji: '⚖️', title: 'Maintain Healthy Weight', desc: 'Being overweight strains the heart. Losing just 5-10% of body weight significantly improves blood pressure, cholesterol, and blood sugar levels.', benefit: '5-10% loss = big gains' },
  { emoji: '🍷', title: 'Limit Alcohol', desc: 'Excessive alcohol raises blood pressure and can cause heart muscle damage. If you drink, limit to 1 drink/day for women and 2 for men.', benefit: 'Moderate = safer' },
  { emoji: '💊', title: 'Regular Check-ups', desc: 'Annual health screenings catch risk factors early. Monitor blood pressure, cholesterol, blood sugar, and BMI regularly with your doctor.', benefit: 'Early detection saves lives' },
  { emoji: '😊', title: 'Social Connections', desc: 'Strong social relationships reduce stress and loneliness, which are independent risk factors for heart disease. Stay connected with family and friends.', benefit: 'Reduces risk by 29%' },
  { emoji: '🌿', title: 'Reduce Processed Foods', desc: 'Ultra-processed foods are linked to higher cardiovascular risk. Cook at home more often using fresh ingredients to control sodium, sugar, and fat intake.', benefit: 'Lower inflammation' },
  { emoji: '🏊', title: 'Swimming & Cycling', desc: 'Low-impact aerobic exercises like swimming and cycling are excellent for heart health, especially for those with joint problems. Aim for 30 min, 5 days/week.', benefit: 'Full-body cardio' },
  { emoji: '🧠', title: 'Mental Health Care', desc: 'Depression and anxiety are linked to increased heart disease risk. Seek professional help if needed — treating mental health protects your heart too.', benefit: 'Holistic protection' },
  { emoji: '🌙', title: 'Sleep Hygiene', desc: 'Poor sleep increases inflammation and stress hormones. Establish a bedtime routine, keep your bedroom cool and dark, and avoid screens before bed.', benefit: '7-9 hrs = optimal' },
];

const PreventionTips = () => (
  <div className="space-y-6">
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white"
    >
      <div className="flex items-center gap-3 mb-3">
        <Shield className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Prevention Tips</h1>
      </div>
      <p className="text-green-100 text-lg max-w-2xl">
        Up to 80% of heart disease cases are preventable through lifestyle changes. Here are proven strategies to protect your heart.
      </p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tips.map((tip, i) => (
        <motion.div key={tip.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <Card className="h-full card-hover">
            <CardContent className="pt-5">
              <div className="text-4xl mb-3">{tip.emoji}</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{tip.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">{tip.desc}</p>
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-1.5">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-green-700 dark:text-green-400">{tip.benefit}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  </div>
);

export default PreventionTips;
