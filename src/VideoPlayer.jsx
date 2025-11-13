import React, { useEffect, useState, useRef } from 'react';
import YouTubePlayer from './YouTubePlayer';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Clock, Save, Search, Loader2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { onAuthStateChanged } from 'firebase/auth';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState({});
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [cloudLoaded, setCloudLoaded] = useState({});
  const [time, setTime] = useState('00:00:00');
  const [text, setText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
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
    console.log('VideoPlayer useEffect: taskId =', taskId);
    
    // Set initial loading state
    setLoading(true);
    setError(null);
    
    // First check if task is in localStorage (fallback)
    const all = loadTasks();
    const lsTask = all.find((x) => x.id === taskId) || null;
    console.log('VideoPlayer: localStorage task =', lsTask);
    
    // Then try to fetch from Firebase (authoritative source)
    const fetchFromFirebase = async () => {
      try {
        console.log('VideoPlayer: Attempting Firebase fetch for taskId:', taskId);
        const currentUser = auth.currentUser;
        console.log('VideoPlayer: currentUser =', currentUser?.uid);
        
        if (!currentUser) {
          console.warn('VideoPlayer: No authenticated user, using localStorage');
          setTask(lsTask);
          setLoading(false);
          if (!lsTask) setError('Task not found');
          return;
        }

        if (!taskId) {
          console.warn('VideoPlayer: taskId is empty/null');
          setTask(null);
          setLoading(false);
          setError('Invalid task ID');
          return;
        }

        const taskRef = doc(db, "users", currentUser.uid, "tasks", taskId);
        console.log('VideoPlayer: Fetching from path:', `users/${currentUser.uid}/tasks/${taskId}`);
        
        const taskSnap = await getDoc(taskRef);
        console.log('VideoPlayer: taskSnap exists?', taskSnap.exists());
        
        if (taskSnap.exists()) {
          const fbTask = { ...taskSnap.data(), id: taskSnap.id };
          console.log('VideoPlayer: Loaded task from Firebase:', fbTask);
          setTask(fbTask);
          setError(null);
        } else {
          console.warn('VideoPlayer: Task not found in Firebase, trying localStorage');
          if (lsTask) {
            setTask(lsTask);
            setError(null);
          } else {
            setTask(null);
            setError('Task not found in database');
          }
        }
      } catch (error) {
        console.error('VideoPlayer: Error fetching from Firebase:', error);
        if (lsTask) {
          setTask(lsTask);
          setError(null);
        } else {
          setTask(null);
          setError(error.message || 'Failed to load task');
        }
      } finally {
        setLoading(false);
      }
    };

    // Wait for auth to be ready, then fetch
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('VideoPlayer: onAuthStateChanged - user =', user?.uid);
      if (user) {
        fetchFromFirebase();
      } else {
        // No auth, try localStorage
        console.warn('VideoPlayer: User not authenticated, using localStorage');
        if (lsTask) {
          setTask(lsTask);
          setError(null);
        } else {
          setTask(null);
          setError('Not authenticated and task not found locally');
        }
        setLoading(false);
      }
    });

  // don't prefill notes from localStorage here — prefer cloud data when available
    
    return () => unsubscribe();
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

  // Listen for cloud notes for this video (if authenticated)
  useEffect(() => {
    let unsub = null;
    async function setupListener() {
      const user = auth.currentUser;
      if (!user) return;
      if (!yt) return; // nothing to listen for

      try {
        const notesCol = collection(db, 'users', user.uid, 'videoNotes');
        const q = query(notesCol, where('videoId', '==', yt), orderBy('createdAt', 'desc'));

        // fetch initial cloud data (prefer cloud over local)
        try {
          const snap = await getDocs(q);
          const arr = [];
          snap.forEach(d => {
            const data = d.data();
            arr.push({
              id: d.id,
              text: data.note || '',
              time: data.timeStamp || '',
              createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString())
            });
          });
          setNotes(prev => ({ ...prev, [taskId]: arr }));
          setCloudLoaded(prev => ({ ...prev, [taskId]: true }));
        } catch (err) {
          console.error('Failed to fetch initial videoNotes:', err);
          // If the query requires an index, fall back to a simpler query (no orderBy)
          // and sort results client-side so the app keeps working without manual index creation.
          const msg = String(err?.message || '').toLowerCase();
          if (msg.includes('requires an index') || msg.includes('index')) {
            try {
              const snap2 = await getDocs(query(notesCol, where('videoId', '==', yt)));
              const arr2 = [];
              snap2.forEach(d => {
                const data = d.data();
                arr2.push({
                  id: d.id,
                  text: data.note || '',
                  time: data.timeStamp || '',
                  createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString())
                });
              });
              // sort descending by createdAt
              arr2.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              setNotes(prev => ({ ...prev, [taskId]: arr2 }));
              setCloudLoaded(prev => ({ ...prev, [taskId]: true }));
            } catch (err2) {
              console.error('Fallback fetch failed:', err2);
            }
          }
        }

        // then subscribe for realtime updates
        try {
          unsub = onSnapshot(q, (snap) => {
            const arr = [];
            snap.forEach(d => {
              const data = d.data();
              arr.push({
                id: d.id,
                text: data.note || '',
                time: data.timeStamp || '',
                createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString())
              });
            });
            setNotes(prev => ({ ...prev, [taskId]: arr }));
            setCloudLoaded(prev => ({ ...prev, [taskId]: true }));
          }, (err) => {
            console.error('Failed to subscribe to videoNotes:', err);
            const msg = String(err?.message || '').toLowerCase();
            if (msg.includes('requires an index') || msg.includes('index')) {
              // fallback: subscribe without orderBy and sort client-side
              try {
                const q2 = query(notesCol, where('videoId', '==', yt));
                unsub = onSnapshot(q2, (snap2) => {
                  const arr2 = [];
                  snap2.forEach(d => {
                    const data = d.data();
                    arr2.push({
                      id: d.id,
                      text: data.note || '',
                      time: data.timeStamp || '',
                      createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString())
                    });
                  });
                  arr2.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                  setNotes(prev => ({ ...prev, [taskId]: arr2 }));
                  setCloudLoaded(prev => ({ ...prev, [taskId]: true }));
                }, (err2) => console.error('Fallback subscription failed:', err2));
              } catch (ex) {
                console.error('Setting up fallback subscription failed:', ex);
              }
            }
          });
        } catch (subErr) {
          console.error('onSnapshot subscription threw:', subErr);
        }
      } catch (err) {
        console.error('Error setting up notes listener:', err);
      }
    }

    // wait for auth to be ready
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) setupListener();
      else {
        // if signed out, fallback to local notes for this task
        setNotes(prev => ({ ...prev, [taskId]: loadNotes()[taskId] || [] }));
        setCloudLoaded(prev => ({ ...prev, [taskId]: false }));
      }
    });

    return () => {
      try { if (unsub) unsub(); } catch (e) {}
      try { unsubAuth(); } catch (e) {}
    };
  }, [yt, taskId]);

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

  // Show loading spinner while fetching from Firebase
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Loading task...</h2>
        </div>
      </div>
    );
  }

  // Show error if task not found and loading is complete
  if (!task && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive">Task not found</h2>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <div className="mt-4">
            <a className="inline-block px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" href="/dashboard">Go back to dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  // Fallback if task is still null (shouldn't happen now)
  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Task not found</h2>
          <p className="text-sm text-muted-foreground mt-2">Return to dashboard and try again.</p>
          <div className="mt-4">
            <a className="inline-block px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" href="/dashboard">Go back to dashboard</a>
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

    // Build note for UI/local storage (ISO timestamp for local display)
    const n = { time: time || '', text: text.trim(), createdAt: new Date().toISOString() };

    // show saving state & toast
    setSavingNote(true);
    const startedAt = Date.now();

    // helper: wait briefly for onAuthStateChanged to provide a user (up to timeoutMs)
    const waitForAuth = (timeoutMs = 4000) => {
      return new Promise((resolve) => {
        const current = auth.currentUser;
        if (current) return resolve(current);
        let resolved = false;
        const unsubscribe = onAuthStateChanged(auth, (u) => {
          if (!resolved) {
            resolved = true;
            unsubscribe();
            resolve(u);
          }
        });
        // timeout fallback
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            try { unsubscribe(); } catch (e) {}
            resolve(null);
          }
        }, timeoutMs);
      });
    };

    // show a quick toast that save started (non-blocking)
    toast('Saving note...');

    (async () => {
      try {
        const user = await waitForAuth(4000);
        if (!user) {
          // no authenticated user available
          throw new Error('No authenticated user');
        }

        console.log('=== addNote: About to save ===');
        console.log('User UID:', user.uid);
        console.log('User email:', user.email);

        // build payload for Firestore
        const payload = {
          note: n.text,
          timeStamp: n.time,
          videoId: yt || null,
          videoTitle: task?.title || null,
          userId: user.uid,
          createdAt: serverTimestamp(),
        };

        console.log('Payload:', payload);
        const colRef = collection(db, 'users', user.uid, 'videoNotes');
        console.log('Collection path: users/' + user.uid + '/videoNotes');
        const docRef = await addDoc(colRef, payload);
        console.log('Video note saved to Firestore, id=', docRef.id);
        toast.success('Note saved to cloud');

        // Save to localStorage after successful cloud save
        const updated = { ...notes, [taskId]: [...taskNotes, n] };
        setNotes(updated);
        saveNotes(updated);

        // Clear inputs on success
        setText('');
        setTime('00:00:00');
        setJustAddedPulse(true);
        setTimeout(() => setJustAddedPulse(false), 700);
      } catch (err) {
        // No fallback: only show error toast, keep inputs so user can retry
        console.warn('Could not save to Firestore:', err);
        try {
          console.warn('Firestore error details:', {
            code: err?.code,
            message: err?.message,
            name: err?.name,
            stack: err?.stack
          });
        } catch (ex) {
          console.warn('Error while logging Firestore error details', ex);
        }

        toast.error('Failed saving notes try again');
      } finally {
        setSavingNote(false);
      }
    })();
  }

  // Debug helper: try a single write to Firestore and log detailed result.
  // Usage from browser console: window.testFirestoreWrite()
  window.testFirestoreWrite = async function testFirestoreWrite() {
    try {
      console.log('=== testFirestoreWrite started ===');
      console.log('auth.currentUser:', auth.currentUser);
      console.log('db instance:', db);
      
      const user = auth.currentUser;
      if (!user) { 
        console.warn('No authenticated user'); 
        return; 
      }
      
      console.log('User UID:', user.uid);
      console.log('User email:', user.email);
      
      const payload = { 
        note: 'test note from console', 
        timeStamp: '00:00:00', 
        videoId: yt || null, 
        videoTitle: task?.title || null, 
        userId: user.uid, 
        createdAt: serverTimestamp() 
      };
      
      console.log('Payload:', payload);
      const colRef = collection(db, 'users', user.uid, 'videoNotes');
      console.log('Collection ref:', colRef);
      console.log('Attempting to write...');
      
      const dr = await addDoc(colRef, payload);
      console.log('✓ SUCCESS - Document written with id:', dr.id);
    } catch (err) {
      console.error('✗ FAILED - Error:', err);
      console.error('Error code:', err?.code);
      console.error('Error message:', err?.message);
      console.error('Full error object:', err);
    }
  };

  function deleteNote(index) {
    // Local-only deletion (remove from local cache). For cloud deletion use deleteNoteCloud
    const arr = (notes[taskId] || []).slice();
    arr.splice(index, 1);
    const updated = { ...notes, [taskId]: arr };
    setNotes(updated);
    saveNotes(updated);
  }

  async function deleteNoteCloud(noteId) {
    if (!noteId) return;
    
    // Show custom toast confirmation instead of window.confirm
    toast.custom((t) => (
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-red-500/30 rounded-lg p-4 shadow-lg">
        <div className="text-sm font-semibold text-white mb-2">Delete Note?</div>
        <p className="text-xs text-gray-300 mb-4">This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t)}
            className="px-3 py-1.5 rounded text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t);
              try {
                setDeletingNoteId(noteId);
                const user = auth.currentUser;
                if (!user) throw new Error('Not authenticated');
                const docRef = doc(db, 'users', user.uid, 'videoNotes', noteId);
                await deleteDoc(docRef);
                toast.success('Note deleted');
                // local snapshot listener will update UI; as fallback, remove from local
                setNotes(prev => ({ ...prev, [taskId]: (prev[taskId] || []).filter(n => n.id !== noteId) }));
              } catch (err) {
                console.error('Failed to delete note from cloud:', err);
                toast.error('Failed to delete note');
              } finally {
                setDeletingNoteId(null);
              }
            }}
            className="px-3 py-1.5 rounded text-xs bg-red-600 hover:bg-red-700 text-white transition-colors font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
    ), { duration: Infinity })
  }

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="min-h-screen p-0 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 relative overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-radial from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 relative z-10">
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
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.4 }}
              className="sticky top-6 p-6 rounded-2xl bg-gradient-to-br from-white/5 via-white/3 to-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 flex flex-col max-h-[96vh] hover:shadow-cyan-500/10 transition-all duration-300"
            >
              <div className="space-y-6 mb-6">
                <div className="text-center">
                  <h4 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 mb-2">Notes</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">Add quick reflections while studying — your notes keep timestamps and stay local.</p>
                </div>

                <div className="flex justify-center">
                  <div className="relative w-4/5">
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      placeholder="Search your notes..."
                      className="w-full pl-12 pr-4 py-3 text-sm rounded-xl bg-white/8 placeholder-slate-400 text-slate-100 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200 hover:bg-white/10 hover:border-white/20 shadow-lg"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Rotating motivational message */}
                <motion.div
                  className="mt-4 text-center p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/10"
                  animate={{ opacity: motVisible ? 1 : 0.7 }}
                  transition={{ duration: 0.7 }}
                >
                  <p className="text-sm text-slate-300 italic font-medium">
                    {MOTIVATIONAL_LINES[motIndex]}
                  </p>
                </motion.div>
              </div>

              {/* Enhanced input area */}
              <div className="mb-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        className="w-full px-4 py-3 rounded-lg bg-white/8 text-sm placeholder-slate-400 text-slate-100 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200 hover:bg-white/10 hover:border-white/20 shadow-lg"
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
                    <div className="text-xs text-slate-400 font-medium">Current timestamp</div>
                  </div>
                  <motion.textarea
                    whileFocus={{ scale: 1.01 }}
                    className="w-full px-4 py-4 rounded-xl bg-white/8 text-sm placeholder-slate-400 text-slate-100 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200 hover:bg-white/10 hover:border-white/20 min-h-[120px] resize-vertical shadow-lg"
                    placeholder="Write your note... ✨ (press Add to save)"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-3 items-center">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addNote}
                    disabled={savingNote}
                    aria-busy={savingNote}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-xl hover:shadow-cyan-500/25 transform transition-all duration-200 ${justAddedPulse ? 'animate-pulse' : ''} ${savingNote ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {savingNote ? 'Saving...' : 'Add'}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setText(''); setTime('00:00:00'); }}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 text-slate-100 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </motion.button>
                </div>
              </div>

              {/* Enhanced notes list */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                {taskNotes.length === 0 ? (
                  <div className="text-sm text-slate-400 text-center py-8">No notes yet — capture quick thoughts with timestamps.</div>
                ) : (
                  <ul className="space-y-4">
                    {taskNotes
                      .filter(n => n.text.toLowerCase().includes(searchQ.toLowerCase()))
                      .map((n, idx) => (
                        <motion.li
                          key={n.id || idx}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="group p-5 bg-gradient-to-br from-white/5 to-white/3 hover:from-white/8 hover:to-white/6 transition-all duration-300 rounded-xl border border-white/10 hover:border-cyan-400/30 shadow-lg hover:shadow-xl hover:shadow-cyan-500/10"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <motion.button
                              whileHover={{ scale: 1.05, y: -1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => seekToTime(n.time)}
                              className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transform transition-all duration-200"
                            >
                              <Clock className="w-3 h-3 mr-2" />
                              {n.time}
                            </motion.button>
                            <div className="flex items-center gap-3">
                              <div className="text-xs text-slate-400 font-medium">{new Date(n.createdAt).toLocaleString()}</div>
                              {n.id ? (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() => deleteNoteCloud(n.id)}
                                  disabled={deletingNoteId === n.id}
                                  className={`opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs text-red-400 hover:text-red-300 hover:underline ${deletingNoteId === n.id ? 'cursor-wait opacity-80' : ''}`}
                                >
                                  {deletingNoteId === n.id ? <Loader2 className="w-3 h-3 animate-spin inline-block mr-1" /> : null}
                                  Delete
                                </motion.button>
                              ) : (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() => deleteNote(idx)}
                                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs text-red-400 hover:text-red-300 hover:underline"
                                >
                                  Delete
                                </motion.button>
                              )}
                            </div>
                          </div>

                          <div className="text-sm text-slate-100 leading-relaxed font-medium">{n.text}</div>
                        </motion.li>
                      ))}
                  </ul>
                )}
              </div>

              <div className="mt-6 text-center text-xs text-slate-400 font-medium">Keep going — consistency compounds 💪</div>
            </motion.div>
          </div>

          <div className="col-span-12 text-center mt-6">
            <a href="/dashboard" className="text-sm underline text-[#94A3B8]">Back to Dashboard</a>
          </div>

          {/* Enhanced Flashcard modal */}
          <AnimatePresence>
            {showFlashModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full max-w-2xl mx-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border border-white/10"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">Flashcards</h3>
                      <div className="text-sm text-slate-400 font-medium">Study mode</div>
                    </div>
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setShowFlashModal(false); }}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-slate-100 transition-all duration-200"
                      >
                        Close
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={deleteCurrentFlashcard}
                        className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300 transition-all duration-200"
                      >
                        Delete
                      </motion.button>
                    </div>
                  </div>
                  {flashcards.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-slate-400 text-lg font-medium">No flashcards available.</div>
                      <div className="text-slate-500 text-sm mt-2">Create flashcards from your notes to start studying.</div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-sm text-slate-400 font-medium">Card {currentCard + 1} of {flashcards.length}</div>
                        <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentCard + 1) / flashcards.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <motion.div
                        key={currentCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-6 rounded-xl bg-gradient-to-br from-white/8 to-white/4 border border-white/10 shadow-lg"
                      >
                        <div className="text-lg font-semibold text-slate-100 mb-4 leading-relaxed">
                          {flashcards[currentCard].question}
                        </div>
                        <AnimatePresence>
                          {showAnswer && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-white/10 pt-4"
                            >
                              <div className="text-sm text-slate-400 font-medium">Answer:</div>
                              <div className="text-base text-slate-200 mt-2">{flashcards[currentCard].answer}</div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      <div className="flex justify-between items-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { setShowAnswer(s => !s); }}
                          className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-white/20 text-slate-100 font-medium transition-all duration-200 shadow-lg"
                        >
                          {showAnswer ? 'Hide Answer' : 'Show Answer'}
                        </motion.button>

                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setCurrentCard(c => Math.max(0, c - 1)); setShowAnswer(false); }}
                            disabled={currentCard === 0}
                            className="px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            ← Prev
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setCurrentCard(c => Math.min(flashcards.length - 1, c + 1)); setShowAnswer(false); }}
                            disabled={currentCard === flashcards.length - 1}
                            className="px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            Next →
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
}
