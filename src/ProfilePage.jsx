import React, { useEffect, useState, useRef, useMemo } from 'react';
import { auth, db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ResponsiveCalendar } from '@nivo/calendar';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import { ArrowLeft, Camera, Edit3, Check, X, Sun, Moon, Monitor, Key, LogOut, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function CountUp({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = null;
    const start = Date.now();
    const from = Number(display);
    const to = Number(value || 0);
    const tick = () => {
      const now = Date.now();
      const t = Math.min(1, (now - start) / duration);
      const v = Math.floor(from + (to - from) * t);
      setDisplay(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span>{display}</span>;
}

export default function ProfilePage() {
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [editing, setEditing] = useState({ field: null, value: '' });
  const [themeLoading, setThemeLoading] = useState(false);
  const fileRef = useRef();

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load user profile data when uid is available
  useEffect(() => {
    if (authLoading) return; // Wait for auth to initialize
    if (!uid) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const dref = doc(db, 'users', uid);
        const snap = await getDoc(dref);
        if (mounted) {
          if (snap.exists()) {
            setUserDoc({ id: snap.id, ...snap.data() });
          } else {
            setUserDoc(null);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        if (mounted) {
          toast.error('Failed to load profile');
          setLoading(false);
        }
      }
    };
    loadProfile();
    return () => { mounted = false; };
  }, [uid, authLoading]);

  const initials = useMemo(() => {
    const name = userDoc?.name || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'U';
    return name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
  }, [userDoc]);

  const formatMemberSince = (input) => {
    if (!input) return '—';
    try {
      let d = input;
      if (input && typeof input === 'object' && typeof input.toDate === 'function') d = input.toDate();
      else d = new Date(input);
      if (Number.isNaN(d.getTime())) return String(input);
      return d.toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (e) {
      return String(input);
    }
  };

  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [_TASKS_LOADING, setTasksLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    const loadTasks = async () => {
      setTasksLoading(true);
      try {
        const colRef = collection(db, 'users', uid, 'tasks');
        const snap = await getDocs(colRef);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (mounted) setTasks(docs);
      } catch (err) {
        console.error('Failed to load tasks for heatmap:', err);
      } finally {
        if (mounted) setTasksLoading(false);
      }
    };
    loadTasks();
    // load notes count as well
    const loadNotes = async () => {
      try {
        const colRef = collection(db, 'users', uid, 'videoNotes');
        const snap = await getDocs(colRef);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (mounted) setNotes(docs);
      } catch (err) {
        console.error('Failed to load notes for profile:', err);
      }
    };
    loadNotes();
    return () => { mounted = false; };
  }, [uid]);

  // Heatmap data derived from completed tasks (same logic used in dashboard)
  const heatMapData = useMemo(() => {
    const data = [];
    const dateMap = new Map();
    tasks.forEach(t => {
      if (t.status === 'done' && t.completedAt) {
        const completionDate = String(t.completedAt).split('T')[0];
        const count = dateMap.get(completionDate) || 0;
        dateMap.set(completionDate, count + 1);
      }
    });
    for (const [day, completedCount] of dateMap) {
      data.push({ day, value: Number(completedCount) });
    }
    return data;
  }, [tasks]);

  const getHeatmapColor = (value) => {
    if (!value || typeof value !== 'number') return 'var(--empty-cell-color)';
    const count = Math.floor(value);
    if (count === 0) return 'var(--empty-cell-color)';
    if (count <= 2) return '#86efac';
    if (count <= 4) return '#22c55e';
    if (count <= 6) return '#f59e0b';
    if (count <= 9) return '#ef4444';
    return '#b91c1c';
  };

  // Derived counts for the profile cards
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalNotes = notes.length;

  // Streak: reuse dashboard logic
  const streak = useMemo(() => {
    if (!tasks.length) return 0;
    const set = new Set();
    for (const t of tasks) {
      if (t.status === 'done' && t.completedAt) {
        const d = new Date(t.completedAt);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        set.add(`${y}-${m}-${dd}`);
      }
    }
    let count = 0;
    const d = new Date();
    while (true) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const ymd = `${y}-${m}-${dd}`;
      if (set.has(ymd)) {
        count += 1;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [tasks]);

  const startEdit = (field) => {
    setEditing({ field, value: userDoc?.[field] || '' });
  };

  const saveEdit = async () => {
    const { field, value } = editing;
    if (!field) return setEditing({ field: null, value: '' });
    try {
      const dref = doc(db, 'users', uid);
      await updateDoc(dref, { [field]: value });
      setUserDoc(prev => ({ ...prev, [field]: value }));
      toast.success('Updated');
    } catch (err) {
      console.error('Failed to save:', err);
      toast.error('Failed to save');
    } finally {
      setEditing({ field: null, value: '' });
    }
  };

  const uploadPicture = async (file) => {
    if (!file) return;
    try {
      toast('Uploading...');
      const sref = storageRef(storage, `users/${uid}/profile.jpg`);
      await uploadBytes(sref, file);
      const url = await getDownloadURL(sref);
      const dref = doc(db, 'users', uid);
      await updateDoc(dref, { photoURL: url });
      setUserDoc(prev => ({ ...prev, photoURL: url }));
      toast.success('Profile picture updated');
    } catch (err) {
      console.error('Upload failed', err);
      toast.error('Upload failed');
    }
  };

  const handleTheme = async (theme) => {
    setThemeLoading(true);
    try {
      const dref = doc(db, 'users', uid);
      await updateDoc(dref, { theme });
      setUserDoc(prev => ({ ...prev, theme }));
      localStorage.setItem('theme', theme);
      
      // Apply theme to document root element
      const root = document.documentElement;
      if (theme === 'system') {
        root.classList.remove('light', 'dark');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) root.classList.add('dark');
      } else {
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
      }
      
      toast.success('Theme updated');
      setThemeLoading(false);
    } catch (err) {
      console.error('Theme update failed', err);
      toast.error('Failed to update theme');
      setThemeLoading(false);
    }
  };

  const sendPasswordReset = async () => {
    try {
      if (!auth.currentUser?.email) throw new Error('No email');
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      toast.success('Password reset email sent');
    } catch (err) {
      console.error('Password reset failed', err);
      toast.error('Failed to send reset email');
    }
  };

  const handleDeleteAccount = () => {
    toast.custom((t) => (
      <div className="w-full max-w-sm bg-gray-900/95 dark:bg-gray-900/98 backdrop-blur-md border border-red-500/50 rounded-lg p-4 shadow-2xl">
        <div className="text-sm font-semibold text-white mb-2">Delete Account?</div>
        <p className="text-xs text-gray-300 mb-4">This will permanently remove all your data including tasks, notes, and profile. This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(t)} className="px-3 py-1.5 rounded text-xs bg-gray-600 hover:bg-gray-500 text-white transition-colors">Cancel</button>
          <button onClick={async () => {
            toast.dismiss(t);
            const deleteLoadingToast = toast.loading('Deleting account and all data...');
            try {
              // Delete all tasks from subcollection
              const tasksRef = collection(db, 'users', uid, 'tasks');
              const taskSnap = await getDocs(tasksRef);
              for (const taskDoc of taskSnap.docs) {
                await deleteDoc(taskDoc.ref);
              }

              // Delete all video notes from subcollection
              const notesRef = collection(db, 'users', uid, 'videoNotes');
              const notesSnap = await getDocs(notesRef);
              for (const noteDoc of notesSnap.docs) {
                await deleteDoc(noteDoc.ref);
              }

              // Delete the main user document
              const userDocRef = doc(db, 'users', uid);
              await deleteDoc(userDocRef);

              toast.dismiss(deleteLoadingToast);
              toast.success('Account and all data permanently deleted');
              await new Promise(r => setTimeout(r, 600));
              await auth.signOut();
              window.location.href = '/';
            } catch (err) {
              console.error('Delete failed', err);
              toast.dismiss(deleteLoadingToast);
              toast.error('Failed to delete account: ' + err.message);
            }
          }} className="px-3 py-1.5 rounded text-xs bg-red-600 hover:bg-red-700 text-white transition-colors">Delete</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  // Show loading screen
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>;
  }

  // If no user, redirect to login
  if (!uid) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Redirecting to login...</div></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => (window.location.href = '/dashboard')} className="p-2 rounded-md bg-white/5 hover:bg-white/8">
          <ArrowLeft />
        </button>
        <h1 className="text-xl md:text-2xl font-semibold">Your Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4">
          <div className="relative p-6 rounded-3xl bg-gradient-to-br from-white/25 via-white/15 to-white/10 dark:from-white/15 dark:via-white/8 dark:to-white/5 backdrop-blur-3xl border border-white/30 dark:border-white/20 shadow-2xl overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 dark:from-cyan-400/10 dark:via-purple-400/10 dark:to-pink-400/10"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-400/10 to-transparent rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/10 to-transparent rounded-full blur-xl"></div>

            <div className="relative flex flex-col items-center z-10">
              <div className="relative">
                {userDoc?.photoURL ? (
                  <div className="relative">
                    <img src={userDoc.photoURL} alt="avatar" className="w-32 h-32 rounded-full object-cover shadow-2xl ring-4 ring-white/20 dark:ring-white/10" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-400/20"></div>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-400/30 via-purple-400/30 to-pink-400/30 dark:from-cyan-400/40 dark:via-purple-400/40 dark:to-pink-400/40 text-white dark:text-white text-2xl font-bold shadow-2xl ring-4 ring-white/20 dark:ring-white/10">
                    {initials}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-gradient-to-br from-cyan-400 to-purple-400 rounded-full p-2.5 cursor-pointer shadow-lg hover:scale-110 transition-transform duration-200">
                  <Camera className="w-4 h-4 text-white" />
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadPicture(e.target.files[0])} />
                </label>
              </div>
              <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">{userDoc?.name || 'Unnamed'}</h2>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{userDoc?.email}</div>

              {/* Decorative badge or status -->For future*/}
              {/* <div className="mt-4 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 dark:from-cyan-400/30 dark:to-purple-400/30 border border-white/20 dark:border-white/10">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Premium Member</span>
              </div> */}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <div className="p-6 rounded-2xl bg-white/20 dark:bg-white/15 backdrop-blur-2xl border border-gray-300/30 dark:border-white/30 shadow-lg">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-6">
                <label className="text-xs text-gray-600 dark:text-gray-300">Full Name</label>
                {editing.field === 'name' ? (
                  <div className="flex gap-2 mt-2">
                    <input className="flex-1 p-3 rounded-lg bg-white dark:bg-black/30 text-gray-900 dark:text-gray-100 placeholder-gray-400 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition" value={editing.value} onChange={(e) => setEditing(s => ({...s, value: e.target.value}))} />
                    <button onClick={saveEdit} className="p-2 bg-green-600 dark:bg-green-600 rounded-lg"><Check className="w-4 h-4"/></button>
                    <button onClick={() => setEditing({field:null,value:''})} className="p-2 bg-gray-400 dark:bg-gray-600 rounded-lg"><X className="w-4 h-4"/></button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="px-4 py-3 rounded-lg bg-white dark:bg-black/30 text-gray-900 dark:text-gray-100 text-lg truncate">{userDoc?.name || '—'}</div>
                    <button onClick={() => startEdit('name')} className="p-2 text-gray-500 dark:text-gray-400"><Edit3 /></button>
                  </div>
                )}
              </div>

              <div className="col-span-12 md:col-span-6">
                <label className="text-xs text-gray-600 dark:text-gray-300">Exam</label>
                {editing.field === 'exam' ? (
                  <div className="flex gap-2 mt-2">
                    <Select value={editing.value} onValueChange={(value) => setEditing(s => ({...s, value}))}>
                      <SelectTrigger className="flex-1 bg-white dark:bg-black/30 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition">
                        <SelectValue placeholder="Select exam" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GATE">GATE</SelectItem>
                        <SelectItem value="IIT-JEE">IIT-JEE</SelectItem>
                      </SelectContent>
                    </Select>
                    <button onClick={saveEdit} className="p-2 bg-green-600 dark:bg-green-600 rounded-lg"><Check className="w-4 h-4"/></button>
                    <button onClick={() => setEditing({field:null,value:''})} className="p-2 bg-gray-400 dark:bg-gray-600 rounded-lg"><X className="w-4 h-4"/></button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="px-4 py-3 rounded-lg bg-white dark:bg-black/30 text-gray-900 dark:text-gray-100 truncate">{userDoc?.exam || '—'}</div>
                    <button onClick={() => startEdit('exam')} className="p-2 text-gray-500 dark:text-gray-400"><Edit3 /></button>
                  </div>
                )}
              </div>

              <div className="col-span-12 md:col-span-6">
                <label className="text-xs text-gray-600 dark:text-gray-300">Exam Date</label>
                {editing.field === 'examDate' ? (
                  <div className="flex gap-2 mt-2">
                    <input type="date" className="flex-1 p-3 rounded-lg bg-white dark:bg-black/30 placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition" value={editing.value} onChange={(e) => setEditing(s => ({...s, value: e.target.value}))} />
                    <button onClick={saveEdit} className="p-2 bg-green-600 dark:bg-green-600 rounded-lg"><Check className="w-4 h-4"/></button>
                    <button onClick={() => setEditing({field:null,value:''})} className="p-2 bg-gray-400 dark:bg-gray-600 rounded-lg"><X className="w-4 h-4"/></button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="px-4 py-3 rounded-lg bg-white dark:bg-black/30 text-gray-900 dark:text-gray-100">{userDoc?.examDate ? formatMemberSince(userDoc?.examDate) : '—'}</div>
                    <button onClick={() => startEdit('examDate')} className="p-2 text-gray-500 dark:text-gray-400"><Edit3 /></button>
                  </div>
                )}
              </div>

              <div className="col-span-12 md:col-span-6">
                <label className="text-xs text-gray-600 dark:text-gray-300">Member Since</label>
                <div className="mt-2"><div className="px-4 py-3 rounded-lg bg-white dark:bg-black/30 text-gray-900 dark:text-gray-100 inline-block">{formatMemberSince(userDoc?.createdAt)}</div></div>
              </div>

              <div className="col-span-12">
                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Theme</div>
                  <div className="rounded-2xl p-0.5 bg-linear-to-r from-[#083344] via-[#0b2545] to-[#2b076e] shadow-[0_6px_30px_rgba(11,22,39,0.45)] dark:from-[#083344] dark:via-[#0b2545] dark:to-[#2b076e]">
                    <div className="bg-gray-100 dark:bg-[rgba(7,12,18,0.55)] rounded-lg p-3 flex items-center gap-3 backdrop-blur-sm">
                    <button onClick={() => handleTheme('light')} disabled={themeLoading} aria-label="Light theme" className={`p-4 rounded-lg transform transition-all duration-200 ${userDoc?.theme==='light'?'ring-2 ring-emerald-400 shadow-lg':''} bg-white dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.2))] hover:scale-110 hover:shadow-xl text-gray-800 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`} title="Light">
                        <Sun className="w-6 h-6 text-black"/>
                      </button>
                      <button onClick={() => handleTheme('dark')} disabled={themeLoading} aria-label="Dark theme" className={`p-4 rounded-lg transform transition-all duration-200 ${userDoc?.theme==='dark'?'ring-2 ring-emerald-400 shadow-lg':''} bg-gray-200 dark:bg-[linear-gradient(135deg,rgba(0,0,0,0.3),rgba(255,255,255,0.05))] hover:scale-110 hover:shadow-xl text-gray-800 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`} title="Dark">
                        <Moon className="w-6 h-6 text-black"/>
                      </button>
                      <button onClick={() => handleTheme('system')} disabled={themeLoading} aria-label="System theme" className={`p-4 rounded-lg transform transition-all duration-200 ${userDoc?.theme==='system'?'ring-2 ring-emerald-400 shadow-lg':''} bg-gray-150 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.2))] hover:scale-110 hover:shadow-xl text-gray-800 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`} title="System">
                        <Monitor className="w-6 h-6"/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
        </div>
      </div>

          {/* Progress Overview */}
          <div className="mt-6 p-6 rounded-2xl bg-white/6 dark:bg-white/6 backdrop-blur-2xl border border-gray-300/20 dark:border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Progress Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5">
                <div className="text-sm text-gray-600 dark:text-gray-300">Tasks Created</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white"><CountUp value={totalTasks||0} /></div>
              </div>
              <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5">
                <div className="text-sm text-gray-600 dark:text-gray-300">Tasks Completed</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white"><CountUp value={completedTasks||0} /></div>
              </div>
              <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5">
                <div className="text-sm text-gray-600 dark:text-gray-300">Notes Added</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white"><CountUp value={totalNotes||0} /></div>
              </div>
              <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5">
                <div className="text-sm text-gray-600 dark:text-gray-300">Current Streak 🔥</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white"><CountUp value={streak||0} /></div>
              </div>
            </div>

            {/* Heatmap (tasks completed) - same component/logic as dashboard */}
            <div className="mt-6">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Focus Activity</div>
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-700 dark:text-muted-foreground mb-2">Heatmap legend (tasks completed)</div>
                <div className="w-full h-3 rounded-md overflow-hidden" style={{ background: 'linear-gradient(to right, #ffffff 0%, #86efac 20%, #22c55e 40%, #f59e0b 60%, #ef4444 80%, #b91c1c 100%)' }} />
                <div className="flex justify-between text-xs text-gray-700 dark:text-muted-foreground mt-2">
                  <span>0</span>
                  <span>1-2</span>
                  <span>3-4</span>
                  <span>5-6</span>
                  <span>7-9</span>
                  <span>10+</span>
                </div>
                <div className="text-[11px] text-gray-700 dark:text-muted-foreground mt-1">Color intensity shows number of tasks completed that day</div>
              </div>

              <div className="overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] pb-2">
                <div className="relative h-[180px] sm:h-[220px] min-w-[600px] w-full">
                  <ResponsiveCalendar
                    data={heatMapData}
                    from={new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]}
                    to={new Date().toISOString().split('T')[0]}
                    emptyColor={"var(--empty-cell-color)"}
                    margin={{ top: 30, right: 32, bottom: 20, left: 40 }}
                    monthBorderColor="transparent"
                    dayBorderWidth={1}
                    dayBorderColor={"var(--cell-border-color)"}
                    daySpacing={4}
                    dayRadius={3}
                    monthSpacing={12}
                    monthLegendPosition="before"
                    monthLegendOffset={10}
                    monthLegendTicks={[0,1,2,3,4,5,6,7,8,9,10,11]}
                    square={true}
                    theme={{ textColor: 'var(--muted-foreground)', fontSize: 10, labels: { text: { fill: 'var(--muted-foreground)', fontSize: 10 } } }}
                    minValue={0}
                    maxValue={10}
                    colorScale={getHeatmapColor}
                    tooltip={({ value, day }) => {
                      const completedTasks = value || 0;
                      return (
                        <div className="rounded-md bg-popover px-3 py-1.5 text-xs border shadow-md">
                          <div className="font-semibold text-popover-foreground">{completedTasks > 0 ? `${completedTasks} completed` : 'No tasks'}</div>
                          <div className="text-[11px] text-popover-foreground">{day}</div>
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Achievements & Actions */}
          <div className="mt-6 p-6 rounded-2xl bg-white/30 dark:bg-[rgba(7,12,18,0.6)] backdrop-blur-2xl border border-gray-300/30 dark:border-[rgba(255,255,255,0.03)]">
            <div className="mt-6">
              {/* containing background box to group action buttons (increased contrast) */}
              <div className="rounded-3xl p-4 bg-white/40 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.78),rgba(2,6,23,0.58))] border border-gray-300/40 dark:border-[rgba(255,255,255,0.04)] shadow-[0_18px_60px_rgba(200,200,200,0.3)] dark:shadow-[0_18px_60px_rgba(3,6,23,0.7)]">
                {/* outer neon / dark gradient border */}
                <div className="rounded-2xl p-0.5 bg-gray-300 dark:bg-[linear-gradient(90deg,#022331,#071226)] shadow-[0_12px_40px_rgba(200,200,200,0.2)] dark:shadow-[0_12px_40px_rgba(3,6,23,0.75)]">
                  <div className="rounded-2xl bg-white dark:bg-[rgba(0,0,0,0.55)] backdrop-blur-sm p-4 flex flex-col gap-4 md:flex-row md:gap-4 md:items-center">

                    {/* Change Password - light blue glass (higher contrast) */}
                    <button onClick={sendPasswordReset} className="flex items-center gap-2 px-4 py-3 md:px-5 md:py-2.5 rounded-lg bg-blue-100 dark:bg-[linear-gradient(180deg,#06b6d4cc,#0369a1cc)] border border-blue-300 dark:border-[rgba(6,182,212,0.22)] text-blue-700 dark:text-white font-medium text-sm transform transition duration-200 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_14px_50px_rgba(6,182,212,0.18)]">
                      <Key className="w-4 h-4" />
                      <span className="hidden sm:inline">Change Password</span>
                      <span className="sm:hidden">Password</span>
                    </button>

                    {/* Logout - light red glass (soft, more contrast) */}
                    <button onClick={() => {
                      toast.custom((t) => (
                        <div className="w-full max-w-sm bg-[rgba(0,0,0,0.8)] dark:bg-[rgba(0,0,0,0.85)] backdrop-blur-md border border-gray-700/40 rounded-lg p-4">
                          <div className="text-sm font-semibold text-white mb-2">Logout?</div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => toast.dismiss(t)} className="px-3 py-1.5 rounded text-xs bg-transparent text-white/80 border border-white/6">Cancel</button>
                            <button onClick={async ()=>{ toast.dismiss(t); await auth.signOut(); window.location.href='/'; }} className="px-3 py-1.5 rounded text-xs bg-red-600 hover:bg-red-700 text-white">Logout</button>
                          </div>
                        </div>
                      ), { duration: Infinity });
                    }} className="flex items-center gap-2 px-4 py-3 md:px-5 md:py-2.5 rounded-lg bg-red-100 dark:bg-[linear-gradient(180deg,#fb7185cc,#ef4444cc)] border border-red-300 dark:border-[rgba(239,68,68,0.22)] text-red-700 dark:text-white font-medium text-sm transform transition duration-200 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_14px_50px_rgba(239,68,68,0.18)]">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>

                    {/* Delete - dark red glass (stronger) */}
                    <button onClick={handleDeleteAccount} className="ml-auto flex items-center gap-2 px-4 py-3 md:px-6 md:py-2.5 rounded-lg bg-red-600 dark:bg-[linear-gradient(180deg,#7f1d1dcc,#581217cc)] text-white font-semibold border border-red-700 dark:border-[rgba(185,28,28,0.24)] shadow-[0_20px_60px_rgba(220,38,38,0.3)] dark:shadow-[0_20px_60px_rgba(185,28,28,0.22)] transform transition duration-200 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_28px_80px_rgba(185,28,28,0.32)]">
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete Account</span>
                      <span className="sm:hidden">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
