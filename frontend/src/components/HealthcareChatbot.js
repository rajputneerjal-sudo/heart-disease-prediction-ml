import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Minus, Send, AlertTriangle } from 'lucide-react';
import { chatbotService } from '../services/chatbotService';

const suggestedQuestions = [
  'What are symptoms of heart disease?',
  'How can I reduce cholesterol?',
  'What foods are good for the heart?',
  'How much exercise is recommended?',
];

const disclaimer = 'This chatbot provides general health awareness information and is not a substitute for professional medical advice, diagnosis, or treatment.';

const HealthcareChatbot = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello, I am your healthcare assistant. Ask me about heart health, lifestyle, or prevention tips.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    chatbotService.getHistory().then((history) => {
      if (!history?.length) return;
      const chat = history.slice(0, 8).reverse().flatMap((item) => [
        { role: 'user', text: item.message },
        { role: 'bot', text: item.response },
      ]);
      setMessages((prev) => [...prev, ...chat]);
    }).catch(() => {});
  }, [open]);

  useEffect(() => {
    const openHandler = () => {
      setOpen(true);
      setMinimized(false);
    };
    window.addEventListener('open-health-assistant', openHandler);
    return () => window.removeEventListener('open-health-assistant', openHandler);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const dailyMessage = useMemo(() => {
    const msgs = [
      'Daily awareness: monitor blood pressure and sleep quality.',
      'Daily awareness: avoid smoking and processed foods.',
      'Daily awareness: a brisk walk supports cardiovascular health.',
    ];
    return msgs[new Date().getDate() % msgs.length];
  }, []);

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const response = await chatbotService.sendMessage(text);
      setMessages((prev) => [...prev, { role: 'bot', text: response.response }]);
    } catch (_e) {
      setMessages((prev) => [...prev, { role: 'bot', text: 'Unable to connect right now. Please try again shortly.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => { setOpen(true); setMinimized(false); }}
        className="fixed bottom-6 right-6 z-[80] w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-2xl flex items-center justify-center"
        whileHover={{ scale: 1.08 }}
        animate={{ boxShadow: ['0 0 0 0 rgba(244,63,94,0.55)', '0 0 0 14px rgba(244,63,94,0)'] }}
        transition={{ duration: 1.7, repeat: Infinity }}
      >
        <Heart className="w-7 h-7" />
      </motion.button>

      <AnimatePresence>
        {open && !minimized && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 z-[90] w-[360px] max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold"><Heart className="w-4 h-4" /> Health Assistant</div>
              <div className="flex items-center gap-1">
                <button onClick={() => setMinimized(true)} className="p-1"><Minus className="w-4 h-4" /></button>
                <button onClick={() => setOpen(false)} className="p-1"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="px-3 py-2 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">{dailyMessage}</div>
            <div ref={scrollRef} className="h-72 overflow-y-auto p-3 space-y-2">
              {messages.map((m, idx) => (
                <div key={`${m.role}-${idx}`} className={`max-w-[85%] p-2.5 rounded-xl text-sm ${m.role === 'user' ? 'ml-auto bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
                  {m.text}
                </div>
              ))}
              {loading && <div className="text-xs text-gray-500">Typing...</div>}
            </div>
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {suggestedQuestions.map((q) => (
                <button key={q} onClick={() => send(q)} className="text-xs px-2 py-1 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                  {q}
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                placeholder="Ask about heart health..."
              />
              <button onClick={() => send()} className="px-3 rounded-xl bg-red-600 text-white"><Send className="w-4 h-4" /></button>
            </div>
            <div className="p-2 text-[11px] text-gray-500 border-t border-gray-100 dark:border-gray-800 flex gap-1">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5" /> {disclaimer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HealthcareChatbot;
