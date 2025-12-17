
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BookOpen, BrainCircuit, RefreshCw, HelpCircle, GraduationCap, Heart, Star, Smile, Mic, MicOff, Image as ImageIcon, X, Camera } from 'lucide-react';
import { ChatMessage, TutorMode, MathResponse, HintResponse } from './types';
import { solveMathProblem, getHint } from './services/geminiService';
import StepItem from './components/StepItem';
import MathDisplay from './components/MathDisplay';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<TutorMode>('solve');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string, preview: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const loadingMessages = [
    "Thinking like a patient teacher...",
    "Working this out carefully for you...",
    "Almost there! Math is a journey...",
    "I'm putting the steps together clearly...",
    "Just a moment, making sure this is easy to follow..."
  ];

  const [currentLoadingMsgIdx, setCurrentLoadingMsgIdx] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentLoadingMsgIdx(prev => (prev + 1) % loadingMessages.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setSelectedImage({
          data: base64String,
          mimeType: file.type,
          preview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input || (selectedImage ? "[Image Problem]" : ""),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentImage = selectedImage;
    
    setInput('');
    removeSelectedImage();
    setIsLoading(true);

    try {
      if (mode === 'solve') {
        const solution = await solveMathProblem(currentInput, currentImage ? { data: currentImage.data, mimeType: currentImage.mimeType } : undefined);
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: solution.encouragement,
          type: 'math-solution',
          data: solution,
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const hint = await getHint(currentInput, currentImage ? { data: currentImage.data, mimeType: currentImage.mimeType } : undefined);
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: hint.encouragement,
          type: 'hint',
          data: hint,
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : "Oh no! Something went a bit wrong. Let's try that again together!",
        type: 'text'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm("Would you like to start a fresh learning session? I'm ready when you are!")) {
      setMessages([]);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-slate-50 border-x border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-lg" aria-hidden="true">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">MathMate</h1>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Your Encouraging Tutor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={clearHistory}
            className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
            aria-label="Start a new session"
            title="Start Fresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main 
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
        aria-live="polite"
        role="log"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-6">
            <div className="relative">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-2 animate-pulse" aria-hidden="true">
                <Smile className="w-12 h-12 text-indigo-400" />
              </div>
              <Heart className="absolute -top-1 -right-1 w-8 h-8 text-pink-400 fill-pink-400 animate-bounce" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Hi there! Ready to learn?</h2>
              <p className="text-slate-500 mt-2 leading-relaxed">
                I'm MathMate. You can type your problem, speak to me, or even upload a photo of your math work!
              </p>
            </div>
            <nav className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full" aria-label="Suggested problems">
              {[
                { label: "Linear Equation", val: "3x + 10 = 25" },
                { label: "Fractions", val: "What is 2/3 plus 1/4?" },
                { label: "Square Roots", val: "Find the square root of 144" },
                { label: "Word Problem", val: "If I have 12 apples and give half away, how many are left?" }
              ].map((item, i) => (
                <button 
                  key={i}
                  onClick={() => setInput(item.val)} 
                  className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:scale-[1.02] transition-all text-left flex items-center justify-between group shadow-sm"
                  aria-label={`Ask about ${item.label}: ${item.val}`}
                >
                  <span>{item.label}</span>
                  <Star className="w-4 h-4 text-slate-200 group-hover:text-amber-400 transition-colors" aria-hidden="true" />
                </button>
              ))}
            </nav>
          </div>
        )}

        {messages.map((msg) => (
          <article 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            aria-label={`${msg.role === 'user' ? 'Your message' : 'MathMate\'s response'}`}
          >
            <div className={`max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 shadow-md' : 'w-full'}`}>
              {msg.role === 'user' ? (
                <div className="font-medium">{msg.content}</div>
              ) : (
                <div className="space-y-4">
                  {msg.content && (
                    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                       <div className="w-10 h-10 bg-indigo-100 rounded-full flex-shrink-0 flex items-center justify-center" aria-hidden="true">
                          <Smile className="w-6 h-6 text-indigo-600" />
                       </div>
                       <p className="text-slate-700 font-medium italic">
                        "{msg.content}"
                      </p>
                    </div>
                  )}

                  {msg.type === 'math-solution' && msg.data && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden animate-in zoom-in-95 duration-300">
                      <div className="p-5 border-b border-slate-100 bg-indigo-50/40 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Our Challenge</p>
                          <MathDisplay math={(msg.data as MathResponse).formattedEquation} className="text-2xl font-bold text-indigo-900" block={false} />
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-indigo-100 shadow-sm" aria-hidden="true">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-xs text-indigo-600 font-bold">Great Choice!</span>
                        </div>
                      </div>
                      
                      <div className="p-6 md:p-8" role="list" aria-label="Solution steps">
                        {(msg.data as MathResponse).steps.map((step, idx) => (
                          <StepItem key={idx} step={step} index={idx} />
                        ))}
                      </div>

                      <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-emerald-100 flex items-start gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0" aria-hidden="true">
                          <BookOpen className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">The Lesson Learned</p>
                          <p className="text-slate-700 font-medium leading-relaxed">{(msg.data as MathResponse).overallConcept}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.type === 'hint' && msg.data && (
                    <div className="bg-white rounded-3xl border border-amber-200 shadow-lg p-6 space-y-5 relative overflow-hidden animate-in zoom-in-95 duration-300">
                      <div className="absolute -top-4 -right-4 p-8 opacity-5" aria-hidden="true">
                        <HelpCircle className="w-24 h-24 text-amber-500" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shadow-inner" aria-hidden="true">
                          <HelpCircle className="w-7 h-7 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">Thinking Cap On!</h3>
                          <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Here's a gentle nudge...</p>
                        </div>
                      </div>
                      <p className="text-slate-700 text-lg italic leading-relaxed pl-2 border-l-4 border-amber-200">
                        "{(msg.data as HintResponse).hint}"
                      </p>
                      <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-inner">
                        <div className="flex items-center gap-2 mb-2">
                           <BrainCircuit className="w-4 h-4 text-amber-600" aria-hidden="true" />
                           <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Your turn to wonder:</p>
                        </div>
                        <p className="text-slate-800 font-bold text-lg">{(msg.data as HintResponse).guidingQuestion}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}

        {isLoading && (
          <div className="flex justify-start" aria-live="assertive" role="status">
            <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-md flex items-center gap-4 animate-pulse">
              <div className="flex space-x-1.5" aria-hidden="true">
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
              </div>
              <span className="text-sm text-slate-600 font-bold italic">
                {loadingMessages[currentLoadingMsgIdx]}
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      {/* Input Section */}
      <footer className="bg-white border-t border-slate-200 p-4 md:p-6 sticky bottom-0 z-10 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
        {selectedImage && (
          <div className="mb-4 relative inline-block animate-in slide-in-from-bottom-2">
            <img src={selectedImage.preview} alt="Problem Preview" className="h-24 w-auto rounded-xl border-2 border-indigo-200 shadow-sm object-cover" />
            <button 
              onClick={removeSelectedImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
              aria-label="Remove uploaded image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4" role="tablist" aria-label="Tutor interaction mode">
          <button
            onClick={() => setMode('solve')}
            role="tab"
            aria-selected={mode === 'solve'}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
              mode === 'solve' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <BrainCircuit className="w-4 h-4" aria-hidden="true" />
            Full Lesson
          </button>
          <button
            onClick={() => setMode('hint')}
            role="tab"
            aria-selected={mode === 'hint'}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
              mode === 'hint' 
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" aria-hidden="true" />
            Just a Nudge
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <label htmlFor="math-input" className="sr-only">Type your math problem</label>
            <input
              id="math-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'solve' ? "Ask me anything... I'm here to help!" : "Tell me what's puzzling you..."}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl pl-6 pr-24 py-5 text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all placeholder:text-slate-400 font-medium text-lg shadow-inner"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 rounded-xl transition-all ${isRecording ? 'bg-red-100 text-red-500 animate-pulse' : 'text-slate-400 hover:bg-slate-200 hover:text-indigo-600'}`}
                aria-label={isRecording ? "Stop recording voice" : "Start recording voice"}
                aria-pressed={isRecording}
                title="Speak to MathMate"
              >
                {isRecording ? <MicOff className="w-6 h-6" aria-hidden="true" /> : <Mic className="w-6 h-6" aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:bg-slate-200 hover:text-indigo-600 rounded-xl transition-all"
                aria-label="Upload a photo of your math problem"
                title="Upload Photo of Problem"
              >
                <ImageIcon className="w-6 h-6" aria-hidden="true" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
                aria-hidden="true"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || isLoading}
            aria-label="Send problem to MathMate"
            className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-300 ${
              (!input.trim() && !selectedImage) || isLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : mode === 'solve' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-105' : 'bg-amber-500 text-white shadow-lg shadow-amber-200 hover:scale-105'
            }`}
          >
            <Send className="w-7 h-7" aria-hidden="true" />
          </button>
        </form>
        <div className="flex items-center justify-center gap-2 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest" aria-hidden="true">
          <Heart className="w-3 h-3 text-pink-400" />
          Built to help you grow
        </div>
      </footer>
    </div>
  );
};

export default App;
