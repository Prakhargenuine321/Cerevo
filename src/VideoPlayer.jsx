import React, { useEffect, useState, useRef } from 'react';
import YouTubePlayer from './YouTubePlayer';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Clock, Save, Search } from 'lucide-react';

const TASKS_LS = 'gate_prep_tasks_v1';
const NOTES_LS = 'gate_prep_notes_v1';
const FLASHCARDS_LS = 'gate_prep_flashcards_v1';

function formatTime(timeStr) {
  const parts = timeStr.split(':').map(x => parseInt(x, 10));
  if (parts.length === 3) {
    const [hours, mins, secs] = parts;
    return (hours * 3600) + (mins * 60) + secs;
  } else if (parts.length === 2) {
    const [mins, secs] = parts;
    return (mins * 60) + secs;
  }
  return 0;
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_LS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(NOTES_LS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveNotes(notes) {
  localStorage.setItem(NOTES_LS, JSON.stringify(notes));
}

function loadFlashcards() {
  try {
    const raw = localStorage.getItem(FLASHCARDS_LS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveFlashcards(cards) {
  localStorage.setItem(FLASHCARDS_LS, JSON.stringify(cards));
}

function parseYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v');
    }
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1);
    }
  } catch (e) {
    // fallback regex
    const m = url.match(/(?:v=|youtu\.be\/|\/embed\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : null;
  }
  return null;
}

function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (hasError) {
      console.error('VideoPlayer encountered an error');
    }
  }, [hasError]);

  if (hasError) {
    return (
      <div className="text-center p-4">
        <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
        <button 
          className="mt-2 text-sm text-primary hover:underline"
          onClick={() => setHasError(false)}
        >
          Try again
        </button>
      </div>
    );
  }

  return children;
}

export default function VideoPlayer({ taskId }) {
  const [task, setTask] = useState(null);
  const [notes, setNotes] = useState({});
  const [time, setTime] = useState('00:00:00');
  const [text, setText] = useState('');
  const videoRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [flashcards, setFlashcards] = useState(loadFlashcards());
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [showFlashModal, setShowFlashModal] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  // Motivational messages (rotate every 45s)
  const MOTIVATIONAL_LINES = [
    "Small steps today → big results tomorrow 🚀",
    "Keep showing up 💪",
    "Deep focus creates deep success 🧠",
    "You don’t need to be perfect — just consistent 🌱",
    "Toppers were once beginners too ✨",
    "Focus mode on. Distractions off 🔒",
    "Stay patient — consistency compounds 📈"
  ];
  
  const [motIndex, setMotIndex] = useState(0);
  const [motVisible, setMotVisible] = useState(true);
  const [filter, setFilter] = useState('all'); // all | today | completed (kept for future)
  const [justAddedPulse, setJustAddedPulse] = useState(false);

  useEffect(() => {
    const all = loadTasks();
    const t = all.find((x) => x.id === taskId) || null;
    setTask(t);
    setNotes(loadNotes());
  }, [taskId]);

    // (Study time tracking removed — timers no longer active)

  // Rotating motivational message effect (45s, with fade)
  useEffect(() => {
    const ROTATE_MS = 45000; // 45 seconds
    let intervalId = null;
    let timeoutId = null;

    function rotate() {
      // fade out
      setMotVisible(false);
      // after fade duration, switch text and fade in
      timeoutId = setTimeout(() => {
        setMotIndex(i => (i + 1) % MOTIVATIONAL_LINES.length);
        setMotVisible(true);
      }, 300); // 300ms fade gap
    }

    intervalId = setInterval(rotate, ROTATE_MS);
    // start first rotation after ROTATE_MS (keeps initial message visible)

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);
  const link = task?.link || '';
  const yt = parseYouTubeId(link);
  const isHtml5Video = /\.(mp4|webm|ogg)(\?|$)/i.test(link || '');
  // Remove enablejsapi to prevent state tracking that can cause flicker/pauses
  const embedSrc = yt ? `https://www.youtube.com/embed/${yt}?rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}` : link;

  // HTML5 video play/pause tracking
  useEffect(() => {
    if (!isHtml5Video || !videoRef.current) return;
    const el = videoRef.current;
    function onPlay() { setIsPlaying(true); }
    function onPause() { setIsPlaying(false); }
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [isHtml5Video, videoRef.current]);

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Task not found</h2>
          <p className="text-sm text-muted-foreground mt-2">Return to dashboard and try again.</p>
          <div className="mt-4">
            <a className="btn" href="/">Go back</a>
          </div>
        </div>
      </div>
    );
  }

  const taskNotes = notes[taskId] || [];

  const seekToTime = (timeStr) => {
    const seconds = formatTime(timeStr);
    if (isHtml5Video && videoRef.current) {
      const wasPlaying = !videoRef.current.paused;
      videoRef.current.currentTime = seconds;
      if (wasPlaying) {
        videoRef.current.play().catch(() => {});
      }
      return;
    }
    // For YouTube videos, use postMessage API for smoother seeking
    if (yt) {
      const iframe = document.querySelector('iframe');
      if (iframe) {
        // Command format: {"event":"command","func":"seekTo","args":[seconds]}
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [seconds]
        }), '*');
        // Force playback to continue if it was playing
        setTimeout(() => {
          iframe.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'playVideo',
            args: []
          }), '*');
        }, 100);
      }
    }
  };

  function toggleSelect(idx) {
    setSelectedIndexes(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  }

  function createFlashcardsFromSelected() {
    if (!taskNotes || selectedIndexes.length === 0) return;
    const selected = selectedIndexes.map(i => taskNotes[i]).filter(Boolean);
    const newCards = selected.map(n => ({ question: n.text, answer: n.time, createdAt: new Date().toISOString(), sourceTaskId: taskId }));
    const updated = [...flashcards, ...newCards];
    setFlashcards(updated);
    saveFlashcards(updated);
    setSelectedIndexes([]);
    // auto open study modal
    setCurrentCard(flashcards.length);
    setShowFlashModal(true);
    setShowAnswer(false);
  }

  function openStudy() {
    if (flashcards.length === 0) return;
    setCurrentCard(0);
    setShowAnswer(false);
    setShowFlashModal(true);
  }

  function togglePiP() {
    const el = videoRef.current;
    if (!el) return;
    // HTMLVideoElement PiP support
    if ((document.pictureInPictureElement && document.exitPictureInPicture) || el.requestPictureInPicture) {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      } else if (el.requestPictureInPicture) {
        el.requestPictureInPicture().catch(() => {});
      }
    }
  }

  function openPopout() {
    // fallback for YouTube - open a small popout window with the embed
    const pop = window.open(embedSrc + '&autoplay=1', 'popout', 'width=480,height=270');
    if (pop) pop.focus();
  }

  function deleteCurrentFlashcard() {
    if (!flashcards || flashcards.length === 0) return;
    // confirm with the user
    // eslint-disable-next-line no-restricted-globals
    const ok = window.confirm('Delete this flashcard? This action cannot be undone.');
    if (!ok) return;
    const idx = currentCard;
    const updated = flashcards.slice();
    updated.splice(idx, 1);
    saveFlashcards(updated);
    setFlashcards(updated);
    // adjust current card index
    if (updated.length === 0) {
      setShowFlashModal(false);
      setShowAnswer(false);
      setCurrentCard(0);
      return;
    }
    const newIndex = Math.min(idx, updated.length - 1);
    setCurrentCard(newIndex);
    setShowAnswer(false);
  }

  function addNote() {
    if (!text.trim()) return;
    const n = { time: time || '', text: text.trim(), createdAt: new Date().toISOString() };
    const updated = { ...notes, [taskId]: [...taskNotes, n] };
    setNotes(updated);
    saveNotes(updated);
    setText('');
    setTime('00:00:00');
    // pulse the add button briefly
    setJustAddedPulse(true);
    setTimeout(() => setJustAddedPulse(false), 700);
  }

  function deleteNote(index) {
    const arr = (notes[taskId] || []).slice();
    arr.splice(index, 1);
    const updated = { ...notes, [taskId]: arr };
    setNotes(updated);
    saveNotes(updated);
  }

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="min-h-screen p-8 bg-linear-to-b from-[#0f172a] to-[#1e293b] text-[#E2E8F0]"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
          {/* Video Column */}
          <div className="col-span-12 lg:col-span-8">
            <div className="rounded-xl overflow-hidden relative border border-white/6 shadow-2xl">

              <div className="w-full h-[56vh] lg:h-[72vh] bg-black relative flex items-center justify-center">
                {isHtml5Video ? (
                  <video
                    ref={videoRef}
                    controls
                    src={link}
                    className="w-full h-full object-contain bg-black rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full">
                    <iframe 
                      src={embedSrc}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* floating badge */}
                <div className="absolute top-4 right-4 z-30">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-linear-to-r from-[#06b6d4]/20 to-[#8b5cf6]/20 border border-white/6 text-xs font-medium text-[#E2E8F0]">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M12 6v6l4 2" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Focus Mode
                  </div>
                </div>
              </div>

              {/* footer */}
              <div className="p-5 bg-linear-to-t from-black/25 to-transparent border-t border-white/4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-linear-to-r from-[#06b6d4] to-[#8b5cf6]">{task.title}</h3>
                  <div className="text-sm text-[#94A3B8] mt-1">{task.subject || 'General'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Column */}
          <div className="col-span-12 lg:col-span-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="sticky top-6 p-6 rounded-2xl bg-white/4 backdrop-blur-md border border-white/6 shadow-lg flex flex-col max-h-[96vh]">
              <div className="space-y-6 mb-6">
                <div className="text-center">
                  <h4 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-[#06b6d4] to-[#8b5cf6]">Notes</h4>
                  <p className="text-sm text-[#94A3B8] mt-2">Add quick reflections while studying — your notes keep timestamps and stay local.</p>
                </div>
                
                <div className="flex justify-center">
                  <div className="relative w-4/5">
                    <input
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      placeholder="Search your notes..."
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/5 placeholder-[#94A3B8] text-[#E2E8F0] border border-white/6 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/25 transition-all hover:bg-white/8"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="6" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </div>

                {/* Rotating motivational message */}
                <div className="mt-3 text-center">
                  <p className={`text-sm text-[#94A3B8] italic transition-opacity duration-700 ${motVisible ? 'opacity-100' : 'opacity-0'}`}>
                    {MOTIVATIONAL_LINES[motIndex]}
                  </p>
                </div>

                {/* Timers removed — motivational message above */}
              </div>

              {/* input area - responsive */}
              <div className="mb-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <input
                        className="w-full px-3 py-2.5 rounded-lg bg-white/6 text-sm placeholder-[#94A3B8] text-[#E2E8F0] border border-white/6 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/25 transition-all hover:bg-white/8"
                        placeholder="hh:mm:ss"
                        value={time}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^[0-9:]*$/.test(value)) setTime(value);
                        }}
                        onBlur={(e) => {
                          const parts = e.target.value.split(':');
                          let formattedTime;
                          if (parts.length === 3) formattedTime = parts.map(p => p.padStart(2, '0')).join(':');
                          else if (parts.length === 2) formattedTime = `00:${parts.map(p => p.padStart(2, '0')).join(':')}`;
                          else formattedTime = '00:00:00';
                          setTime(formattedTime);
                        }}
                      />
                    </div>
                    <div className="text-xs text-[#94A3B8]">Current timestamp</div>
                  </div>
                  <div>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl bg-white/5 text-sm placeholder-[#94A3B8] text-[#E2E8F0] border border-white/6 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/25 transition-all hover:bg-white/8 min-h-[120px] resize-vertical"
                      placeholder="Write your note... ✨ (press Add to save)"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <button
                    onClick={addNote}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold bg-linear-to-r from-[#06b6d4] to-[#8b5cf6] text-black shadow-md transform transition active:scale-95 ${justAddedPulse ? 'animate-pulse' : ''}`}
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>

                  <button
                    onClick={() => { setText(''); setTime('00:00:00'); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-transparent text-[#E2E8F0] border border-white/6 hover:bg-white/3 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>

              {/* notes list (scrollable) */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-3" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
                {taskNotes.length === 0 ? (
                  <div className="text-sm text-[#94A3B8]">No notes yet — capture quick thoughts with timestamps.</div>
                ) : (
                  <ul className="space-y-3">
                    {taskNotes
                      .filter(n => n.text.toLowerCase().includes(searchQ.toLowerCase()))
                      .map((n, idx) => (
                        <motion.li 
                          key={idx} 
                          initial={{ opacity: 0, y: 8 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ duration: 0.28 }} 
                          className="group p-4 bg-white/3 hover:bg-white/6 transition-all rounded-xl border border-white/6 hover:border-[#06b6d4]/20 shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <button 
                              onClick={() => seekToTime(n.time)} 
                              className="inline-flex items-center px-3 py-1.5 rounded-full bg-linear-to-r from-[#06b6d4] to-[#8b5cf6] text-white text-xs font-medium hover:scale-105 transform transition-all duration-200 shadow-sm"
                            >
                              <Clock className="w-3 h-3 mr-1.5" /> 
                              {n.time}
                            </button>
                            <div className="flex items-center gap-3">
                              <div className="text-xs text-[#94A3B8]">{new Date(n.createdAt).toLocaleString()}</div>
                              <button 
                                onClick={() => deleteNote(idx)} 
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-400 hover:text-red-300 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="text-sm text-[#E2E8F0] leading-relaxed">{n.text}</div>
                        </motion.li>
                      ))}
                  </ul>
                )}
              </div>

              <div className="mt-4 text-center text-xs text-[#94A3B8]">Keep going — consistency compounds 💪</div>
            </motion.div>
          </div>

          <div className="col-span-12 text-center mt-6">
            <a href="/" className="text-sm underline text-[#94A3B8]">Back to Dashboard</a>
          </div>

          {/* Flashcard modal (unchanged logic but styled) */}
          <AnimatePresence>
            {showFlashModal && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="w-full max-w-2xl mx-4 bg-[#0f172a] rounded-xl p-6 shadow-2xl border border-white/6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Flashcards</h3>
                      <div className="text-sm text-[#94A3B8]">Study mode</div>
                    </div>
                    <div className="space-x-2">
                      <button className="text-sm text-[#06b6d4]" onClick={() => { setShowFlashModal(false); }}>Close</button>
                      <button className="text-sm text-destructive ml-2" onClick={deleteCurrentFlashcard}>Delete</button>
                    </div>
                  </div>
                  {flashcards.length === 0 ? (
                    <div className="text-sm">No flashcards available.</div>
                  ) : (
                    <div>
                      <div className="mb-4">
                        <div className="text-sm text-[#94A3B8]">Card {currentCard + 1} / {flashcards.length}</div>
                        <div className="mt-2 p-4 rounded-lg bg-white/4"> 
                          <div className="text-base font-medium">{flashcards[currentCard].question}</div>
                          {showAnswer && (
                            <div className="mt-3 text-sm text-[#94A3B8]">{flashcards[currentCard].answer}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <button className="px-3 py-2 rounded bg-white/6" onClick={() => { setShowAnswer(s => !s); }}>{showAnswer ? 'Hide Answer' : 'Show Answer'}</button>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-2 rounded bg-white/6" onClick={() => { setCurrentCard(c => Math.max(0, c - 1)); setShowAnswer(false); }}>Prev</button>
                          <button className="px-3 py-2 rounded bg-white/6" onClick={() => { setCurrentCard(c => Math.min(flashcards.length - 1, c + 1)); setShowAnswer(false); }}>Next</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
}
