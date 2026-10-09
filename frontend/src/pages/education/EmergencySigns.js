import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Phone, Clock } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';

const symptoms = [
  { emoji: '💔', title: 'Chest Pain or Pressure', severity: 'Critical', desc: 'Feeling of pressure, squeezing, fullness, or pain in the center or left side of the chest. May last more than a few minutes or go away and come back.', action: 'Call 112 or 108 immediately. Do not drive yourself to the hospital.' },
  { emoji: '😮‍💨', title: 'Shortness of Breath', severity: 'Critical', desc: 'Difficulty breathing, especially when combined with chest discomfort. May occur with or without chest pain, even at rest or with minimal activity.', action: 'Sit upright, loosen tight clothing, call emergency services.' },
  { emoji: '😵', title: 'Dizziness or Lightheadedness', severity: 'High', desc: 'Sudden dizziness, feeling faint, or loss of balance. May indicate reduced blood flow to the brain due to heart problems.', action: 'Sit or lie down immediately. Call for help if it persists.' },
  { emoji: '💫', title: 'Irregular Heartbeat', severity: 'High', desc: 'Heart pounding, racing, fluttering, or skipping beats (palpitations). Especially concerning if accompanied by dizziness or chest pain.', action: 'Note the duration and frequency. Seek immediate medical attention.' },
  { emoji: '🤢', title: 'Nausea & Cold Sweats', severity: 'High', desc: 'Unexplained nausea, vomiting, or breaking out in a cold sweat. Women are more likely to experience these atypical heart attack symptoms.', action: 'Do not dismiss these symptoms. Seek emergency care.' },
  { emoji: '💪', title: 'Pain in Arm, Jaw, or Back', severity: 'Critical', desc: 'Pain or discomfort that spreads to the shoulder, arm, back, neck, or jaw. This radiating pain is a classic heart attack warning sign.', action: 'Call 112 or 108 immediately. Chew aspirin if not allergic.' },
  { emoji: '🦵', title: 'Swollen Legs or Ankles', severity: 'Moderate', desc: 'Swelling in the legs, ankles, or feet can indicate heart failure, where the heart is not pumping blood efficiently.', action: 'Consult a doctor promptly. Elevate legs and reduce salt intake.' },
  { emoji: '😴', title: 'Extreme Fatigue', severity: 'Moderate', desc: 'Unusual or extreme tiredness, especially in women. Feeling exhausted even after rest may indicate the heart is working harder than normal.', action: 'Track symptoms and consult a healthcare provider.' },
];

const severityColors = {
  Critical: 'bg-red-100 border-red-300 dark:bg-red-900/20 dark:border-red-700',
  High: 'bg-orange-100 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700',
  Moderate: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700',
};

const severityBadge = {
  Critical: 'bg-red-600 text-white',
  High: 'bg-orange-500 text-white',
  Moderate: 'bg-yellow-500 text-white',
};

const EmergencySigns = () => (
  <div className="space-y-6">
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="gradient-danger rounded-2xl p-8 text-white"
    >
      <div className="flex items-center gap-3 mb-3">
        <AlertTriangle className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Emergency Warning Signs</h1>
      </div>
      <p className="text-red-100 text-lg max-w-2xl mb-4">
        Recognizing heart attack and cardiac emergency symptoms can save your life. Act FAST — every minute matters.
      </p>
      <div className="flex flex-wrap gap-3">
        <div className="bg-white/20 rounded-xl px-4 py-2 flex items-center gap-2">
          <Phone className="w-5 h-5" />
          <span className="font-bold">Emergency: 112 / 108</span>
        </div>
        <div className="bg-white/20 rounded-xl px-4 py-2 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span className="font-bold">Golden Hour: Act within 60 min</span>
        </div>
      </div>
    </motion.div>

    {/* FAST acronym */}
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Remember F.A.S.T.</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { letter: 'F', word: 'Face', desc: 'Face drooping or numbness on one side?' },
            { letter: 'A', word: 'Arms', desc: 'Arm weakness — can you raise both arms?' },
            { letter: 'S', word: 'Speech', desc: 'Speech slurred or difficulty speaking?' },
            { letter: 'T', word: 'Time', desc: 'Time to call 112 or 108 immediately!' },
          ].map(item => (
            <div key={item.letter} className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center border border-red-200 dark:border-red-800">
              <div className="text-4xl font-black text-red-600 mb-1">{item.letter}</div>
              <div className="font-bold text-gray-900 dark:text-white">{item.word}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {symptoms.map((s, i) => (
        <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
          <div className={`rounded-2xl p-5 border ${severityColors[s.severity]}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{s.emoji}</span>
                <h3 className="font-bold text-gray-900 dark:text-white">{s.title}</h3>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${severityBadge[s.severity]}`}>{s.severity}</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{s.desc}</p>
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">⚡ Action: {s.action}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>

    <div className="bg-red-600 rounded-2xl p-6 text-white text-center">
      <Phone className="w-12 h-12 mx-auto mb-3" />
      <h2 className="text-2xl font-bold mb-2">When in Doubt, Call 112 or 108</h2>
      <p className="text-red-100">It is always better to call emergency services and be wrong than to wait and risk permanent heart damage or death. Emergency responders can begin treatment immediately.</p>
    </div>
  </div>
);

export default EmergencySigns;
