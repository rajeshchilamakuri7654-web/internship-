import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Play, HelpCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import { toast } from '../hooks/useToast';

interface Child {
  id: string;
  name: string;
  age: number;
  classroom_name: string;
  allergies: any[];
}

interface Classroom {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  classroom_id: string;
  classroom_name: string;
  meal_id: string;
  meal_name: string;
  meal_type: string;
  assigned_date: string;
}

interface Alert {
  id: string;
  title: string;
  severity: string;
  is_read: boolean;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function VoiceAgent() {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Loaded database state for local query execution
  const [children, setChildren] = useState<Child[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Predefined prompts for easy click-testing
  const suggestions = [
    "Who is allergic to peanuts?",
    "Does Leo have allergies?",
    "What is today's menu for Room 1?",
    "Are there any allergy warnings today?",
    "What are the symptoms of soy allergy?",
  ];

  // Initialize Speech APIs and load database stats
  useEffect(() => {
    if (SpeechRecognition) {
      setSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setListening(true);
        setTranscript('Listening...');
      };

      rec.onend = () => {
        setListening(false);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          toast('Microphone permission blocked. Please enable mic access.', 'error');
        } else {
          toast('Speech recognition failed. Try again.', 'error');
        }
        setListening(false);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleQuery(text);
      };

      recognitionRef.current = rec;
    }

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Fetch local daycare data when Voice Agent is activated
  const loadDatabaseData = async () => {
    setLoading(true);
    try {
      const [childrenRes, classroomsRes, assignRes, alertsRes] = await Promise.all([
        api.get('/children'),
        api.get('/classrooms'),
        api.get('/meal-assignments'),
        api.get('/alerts'),
      ]);
      setChildren(childrenRes.data || []);
      setClassrooms(classroomsRes.data || []);
      setAssignments(assignRes.data || []);
      setAlerts(alertsRes.data || []);
    } catch (err) {
      console.error('Voice assistant failed to load database cache:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = () => {
    const nextState = !active;
    setActive(nextState);
    if (nextState) {
      loadDatabaseData();
      setReply('Hello! I am GuardBot, your food allergy safety voice assistant. Ask me about menus, allergies, warnings, or symptoms.');
      speak('Hello! I am GuardBot, your food allergy safety voice assistant. Ask me about menus, allergies, warnings, or symptoms.');
    } else {
      stopSpeaking();
      stopListening();
      setTranscript('');
      setReply('');
      setShowSuggestions(false);
    }
  };

  const startListening = () => {
    if (!supported || !recognitionRef.current) {
      toast('Speech recognition is not supported in this browser.', 'error');
      return;
    }
    stopSpeaking();
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
    }
  };

  const speak = (text: string) => {
    if (!voiceEnabled || !synthRef.current) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    // Pick a natural voice if available
    const voices = synthRef.current.getVoices();
    const voice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setSpeaking(false);
    }
  };

  // Local rule-based processing engine
  const handleQuery = (text: string) => {
    const query = text.toLowerCase().trim();
    let result = '';

    // 1. Who is allergic to X
    if (query.includes('allergic to') && (query.includes('who') || query.includes('anyone') || query.includes('any child'))) {
      const match = query.match(/allergic to\s+([a-zA-Z\s]+)/);
      if (match) {
        const allergen = match[1].trim().replace(/s$/, ''); // singularize (e.g. peanuts -> peanut)
        const matches = children.filter(c =>
          (c.allergies || []).some(a => a.allergen_name.toLowerCase().includes(allergen))
        );
        if (matches.length > 0) {
          const names = matches.map(c => {
            const allg = c.allergies.find((a: any) => a.allergen_name.toLowerCase().includes(allergen));
            return `${c.name} (${allg?.severity || 'medium'} severity)`;
          }).join(', ');
          result = `The following children are allergic to ${allergen}: ${names}.`;
        } else {
          result = `I found no children registered with a ${allergen} allergy.`;
        }
      }
    }

    // 2. Child allergies or symptoms: "what is Leo allergic to" or "does Leo have allergies"
    if (!result) {
      const matchedChild = children.find(c => query.includes(c.name.toLowerCase()));
      if (matchedChild) {
        if (query.includes('allergic') || query.includes('allergy') || query.includes('allergies')) {
          const list = (matchedChild.allergies || []).map(a => `${a.allergen_name} (${a.severity} risk)`).join(', ');
          result = list ? `${matchedChild.name} is allergic to: ${list}.` : `${matchedChild.name} has no registered allergies.`;
        } else if (query.includes('symptom') || query.includes('happen') || query.includes('reaction')) {
          const list = (matchedChild.allergies || [])
            .filter(a => a.symptoms)
            .map(a => `${a.allergen_name}: ${a.symptoms}`)
            .join('. ');
          result = list ? `For ${matchedChild.name}, registered symptoms are: ${list}.` : `I have no symptoms registered for ${matchedChild.name}.`;
        } else {
          result = `${matchedChild.name} is enrolled in ${matchedChild.classroom_name} and has ${matchedChild.allergies?.length || 0} registered allergies.`;
        }
      }
    }

    // 3. General symptoms: "symptoms of peanut allergy"
    if (!result && query.includes('symptom')) {
      const commonAllergens = ['peanut', 'milk', 'egg', 'wheat', 'soy', 'fish', 'shellfish', 'tree nut'];
      const matchedAllergen = commonAllergens.find(a => query.includes(a));
      if (matchedAllergen) {
        const generalSymptoms: Record<string, string> = {
          peanut: 'hives, facial swelling, tightening throat, vomiting, and risk of anaphylaxis',
          milk: 'skin hives, vomiting, wheezing, digestive cramps, and loose stools',
          egg: 'skin inflammation, hives, runny nose, abdominal cramps, and nausea',
          wheat: 'hives, skin rash, nausea, stomach cramps, sneezing, and runny nose',
          soy: 'tingling mouth, hives, skin itching, wheezing, and abdominal pain',
          fish: 'skin rashes, vomiting, stomach cramps, and breathing difficulty',
          shellfish: 'hives, swelling of lips or tongue, wheezing, and abdominal pain',
        };
        result = `Symptoms of ${matchedAllergen} allergy typically include ${generalSymptoms[matchedAllergen] || 'hives, rashes, and digestive or respiratory distress'}.`;
      }
    }

    // 4. Menus: "what is the menu for Room 1 today" or "what is today's menu for Room 1"
    if (!result && (query.includes('menu') || query.includes('lunch') || query.includes('breakfast') || query.includes('snack') || query.includes('meal'))) {
      const matchedClassroom = classrooms.find(c =>
        query.includes(c.name.toLowerCase()) || query.includes(c.name.toLowerCase().replace(' room', ''))
      );
      if (matchedClassroom) {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayAssignments = assignments.filter(a =>
          a.assigned_date === todayStr &&
          (a.classroom_id === matchedClassroom.id || a.classroom_name?.toLowerCase() === matchedClassroom.name?.toLowerCase())
        );
        if (todayAssignments.length > 0) {
          const details = todayAssignments.map(a => `${a.meal_type}: ${a.meal_name}`).join(', ');
          result = `Today's menu for ${matchedClassroom.name} is: ${details}.`;
        } else {
          result = `No meals have been scheduled for ${matchedClassroom.name} today.`;
        }
      } else {
        result = "Please specify the classroom. For example, ask: What is today's menu for Room 1?";
      }
    }

    // 5. Active alerts: "active alerts" or "warnings today"
    if (!result && (query.includes('alert') || query.includes('warning') || query.includes('danger') || query.includes('conflict'))) {
      const activeAlerts = alerts.filter(a => !a.is_read);
      if (activeAlerts.length > 0) {
        const details = activeAlerts.slice(0, 3).map(a => a.title).join('. ');
        result = `We have ${activeAlerts.length} active alerts today. Key warnings are: ${details}.`;
      } else {
        result = "All clear! There are no active allergy alerts or warnings today.";
      }
    }

    // Default Fallback
    if (!result) {
      result = "I couldn't match that query. You can ask: Who is allergic to peanuts? Does Leo have allergies? What is today's menu for Room 1? Or, are there any allergy warnings today?";
    }

    setReply(result);
    speak(result);
  };

  const handleSuggestionClick = (text: string) => {
    setTranscript(text);
    handleQuery(text);
    setShowSuggestions(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
      {/* Voice Assistant Panel */}
      {active && (
        <div className="glass-card animate-fade-in" style={{
          width: '320px',
          padding: '1.25rem',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: listening ? '#ef4444' : '#22c55e', animation: listening ? 'pulse 1.5s infinite' : 'none' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9' }}>GuardBot AI</span>
              {loading && <Loader2 size={12} className="animate-spin" style={{ color: '#64748b' }} />}
            </div>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                style={{ padding: '0.25rem', height: 'auto', borderRadius: '0.375rem' }}
                title={voiceEnabled ? 'Mute Assistant' : 'Unmute Assistant'}
              >
                {voiceEnabled ? <Volume2 size={14} color="#94a3b8" /> : <VolumeX size={14} color="#ef4444" />}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setShowSuggestions(!showSuggestions)}
                style={{ padding: '0.25rem', height: 'auto', borderRadius: '0.375rem' }}
                title="View suggestions"
              >
                <HelpCircle size={14} color="#94a3b8" />
              </button>
              <button
                className="btn btn-ghost"
                onClick={toggleActive}
                style={{ padding: '0.25rem', height: 'auto', borderRadius: '0.375rem' }}
              >
                <X size={14} color="#94a3b8" />
              </button>
            </div>
          </div>

          {/* Transcript Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', minHeight: '120px', maxHeight: '200px', overflowY: 'auto', marginBottom: '0.75rem', paddingRight: '4px' }}>
            {transcript && (
              <div style={{ alignSelf: 'flex-end', background: '#3b82f6', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.75rem 0.75rem 0 0.75rem', fontSize: '0.75rem', maxWidth: '85%', wordBreak: 'break-word' }}>
                {transcript}
              </div>
            )}
            {reply && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.04)', color: '#e2e8f0', padding: '0.5rem 0.75rem', borderRadius: '0.75rem 0.75rem 0.75rem 0', fontSize: '0.75rem', maxWidth: '85%', wordBreak: 'break-word', lineHeight: 1.4 }}>
                {reply}
              </div>
            )}
          </div>

          {/* Suggestions List */}
          {showSuggestions && (
            <div className="glass-card animate-fade-in" style={{ padding: '0.5rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', paddingLeft: '0.25rem' }}>
                💡 Click a Command to Test
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    className="btn btn-ghost"
                    onClick={() => handleSuggestionClick(s)}
                    style={{ fontSize: '0.7rem', padding: '0.375rem 0.5rem', textAlign: 'left', display: 'flex', gap: '0.375rem', justifyContent: 'flex-start', height: 'auto', color: '#3b82f6' }}
                  >
                    <Play size={10} style={{ flexShrink: 0, marginTop: 2 }} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mic Trigger */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            {listening ? (
              <button className="btn btn-danger animate-pulse" onClick={stopListening} style={{ width: '100%', gap: '0.5rem', fontSize: '0.78rem' }}>
                <MicOff size={16} /> Stop Listening
              </button>
            ) : (
              <button className="btn btn-primary" onClick={startListening} style={{ width: '100%', gap: '0.5rem', fontSize: '0.78rem' }}>
                <Mic size={16} /> Talk to GuardBot
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Bubble Toggle Button */}
      <button
        onClick={toggleActive}
        className={`btn ${active ? 'btn-danger' : 'btn-primary'}`}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.5)',
          transition: 'all 0.3s ease',
          padding: 0,
          border: 'none',
        }}
        title="Toggle Allergy Voice Assistant"
      >
        {active ? <X size={24} /> : (
          <div style={{ position: 'relative' }}>
            <Mic size={24} />
            {/* Visual pulsing rings to attract attention to new feature */}
            {!active && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#ef4444',
                border: '2px solid #0f172a',
              }} />
            )}
          </div>
        )}
      </button>

      {/* Custom pulse keyframe injector */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .4; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
