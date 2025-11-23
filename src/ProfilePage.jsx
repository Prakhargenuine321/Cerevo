import React, { useEffect, useState, useRef, useMemo } from 'react';
import { auth, db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ResponsiveCalendar } from '@nivo/calendar';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import { ArrowLeft, Camera, Edit3, Check, X, Sun, Moon, Monitor, Key, LogOut, Trash2, User, Calendar, Award, Flame, Mail, Copy, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

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
    return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
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
    // Optimistic Update: Apply changes immediately
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

    // Background Sync
    try {
      const dref = doc(db, 'users', uid);
      await updateDoc(dref, { theme });
      // toast.success('Theme updated'); // Optional: might be too noisy for instant action
    } catch (err) {
      console.error('Theme update failed', err);
      toast.error('Failed to sync theme preference');
      // Optional: Revert UI here if strict consistency is needed
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
      <div className="w-full max-w-sm bg-background border border-destructive/50 rounded-lg p-4 shadow-2xl">
        <div className="text-sm font-semibold text-foreground mb-2">Delete Account?</div>
        <p className="text-xs text-muted-foreground mb-4">This will permanently remove all your data including tasks, notes, and profile. This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(t)} className="px-3 py-1.5 rounded text-xs bg-muted hover:bg-muted/80 text-foreground transition-colors">Cancel</button>
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
          }} className="px-3 py-1.5 rounded text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors">Delete</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-muted-foreground text-sm">Loading profile...</div>
        </div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-3 md:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="p-2.5 rounded-xl bg-card hover:bg-accent border border-border transition-all duration-200 hover:shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight">Your Profile</h1>
            <p className="text-muted-foreground text-xs md:text-sm">Manage your account settings and preferences</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Column: Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-12 lg:col-span-4"
          >
            <div className="relative p-6 md:p-8 rounded-3xl bg-card border border-border shadow-xl overflow-hidden group">
              {/* Decorative background elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative flex flex-col items-center z-10">
                <div className="relative mb-6">
                  {userDoc?.photoURL ? (
                    <div className="relative group/avatar">
                      <img
                        src={userDoc.photoURL}
                        alt="avatar"
                        className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover shadow-2xl ring-4 ring-background transition-transform duration-300 group-hover/avatar:scale-105"
                      />
                      <div className="absolute inset-0 rounded-full bg-black/0 group-hover/avatar:bg-black/10 transition-colors duration-300"></div>
                    </div>
                  ) : (
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-3xl md:text-4xl font-bold shadow-2xl ring-4 ring-background">
                      {initials}
                    </div>
                  )}
                  <label className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-2.5 md:p-3 cursor-pointer shadow-lg hover:scale-110 hover:bg-primary/90 transition-all duration-200">
                    <Camera className="w-4 h-4 md:w-5 md:h-5" />
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadPicture(e.target.files[0])} />
                  </label>
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-foreground text-center mb-2">{userDoc?.name || 'Unnamed User'}</h2>

                <div className="group/email relative flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 dark:bg-primary/10 border border-primary/10 hover:border-primary/20 transition-all duration-300 backdrop-blur-sm cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(userDoc?.email);
                    toast.success('Email copied to clipboard');
                  }}
                >
                  <Mail className="w-3.5 h-3.5 text-primary/70" />
                  <span className="text-sm font-medium text-foreground/80">{userDoc?.email}</span>
                  <div className="w-px h-3 bg-border mx-1"></div>
                  <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover/email:opacity-100 transition-opacity duration-200" />
                  <div className="absolute -right-1 -top-1">
                    <div className="bg-background rounded-full p-0.5 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-500/10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Details & Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-12 lg:col-span-8 space-y-6"
          >
            {/* Personal Info Card */}
            <div className="p-5 md:p-6 rounded-2xl bg-card border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
                  {editing.field === 'name' ? (
                    <div className="flex flex-col min-[350px]:flex-row gap-2">
                      <div className="flex-1 relative rounded-lg p-[1px] overflow-hidden">
                        <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#22d3ee_20%,#818cf8_50%,#c084fc_80%,transparent_100%)]" />
                        <input
                          autoFocus
                          className="relative w-full h-full px-3 py-2 rounded-lg bg-background border-none outline-none focus:ring-0"
                          value={editing.value}
                          onChange={(e) => setEditing(s => ({ ...s, value: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={saveEdit} className="flex-1 min-[350px]:flex-none p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center justify-center"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditing({ field: null, value: '' })} className="flex-1 min-[350px]:flex-none p-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 flex items-center justify-center"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="group flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-transparent hover:border-border transition-all">
                      <span className="font-medium">{userDoc?.name || '—'}</span>
                      <button onClick={() => startEdit('name')} className="p-1.5 text-muted-foreground hover:text-primary transition-all cursor-pointer"><Edit3 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>

                {/* Exam */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Exam</label>
                  {editing.field === 'exam' ? (
                    <div className="flex flex-col min-[350px]:flex-row gap-2">
                      <Select value={editing.value} onValueChange={(value) => setEditing(s => ({ ...s, value }))}>
                        <div className="flex-1 relative rounded-lg p-[1px] overflow-hidden">
                          <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#22d3ee_20%,#818cf8_50%,#c084fc_80%,transparent_100%)]" />
                          <SelectTrigger className="relative w-full h-full bg-background dark:bg-card border-none outline-none focus:ring-0 focus:ring-offset-0 z-10">
                            <SelectValue placeholder="Select exam" />
                          </SelectTrigger>
                        </div>
                        <SelectContent>
                          <SelectItem value="GATE">GATE</SelectItem>
                          <SelectItem value="IIT-JEE">IIT-JEE</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={saveEdit} className="flex-1 min-[350px]:flex-none p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center justify-center"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditing({ field: null, value: '' })} className="flex-1 min-[350px]:flex-none p-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 flex items-center justify-center"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="group flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-transparent hover:border-border transition-all">
                      <span className="font-medium">{userDoc?.exam || '—'}</span>
                      <button onClick={() => startEdit('exam')} className="p-1.5 text-muted-foreground hover:text-primary transition-all cursor-pointer"><Edit3 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>

                {/* Exam Date */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Exam Date</label>
                  {editing.field === 'examDate' ? (
                    <div className="flex flex-col min-[350px]:flex-row gap-2">
                      <div className="flex-1 relative rounded-lg p-[1px] overflow-hidden">
                        <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#22d3ee_20%,#818cf8_50%,#c084fc_80%,transparent_100%)]" />
                        <input
                          type="date"
                          className="relative w-full h-full px-3 py-2 rounded-lg bg-background border-none outline-none focus:ring-0"
                          value={editing.value}
                          onChange={(e) => setEditing(s => ({ ...s, value: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={saveEdit} className="flex-1 min-[350px]:flex-none p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center justify-center"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditing({ field: null, value: '' })} className="flex-1 min-[350px]:flex-none p-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 flex items-center justify-center"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="group flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-transparent hover:border-border transition-all">
                      <span className="font-medium">{userDoc?.examDate ? formatMemberSince(userDoc?.examDate) : '—'}</span>
                      <button onClick={() => startEdit('examDate')} className="p-1.5 text-muted-foreground hover:text-primary transition-all cursor-pointer"><Edit3 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>

                {/* Member Since */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Member Since</label>
                  <div className="p-3 rounded-lg bg-accent/30 border border-transparent text-muted-foreground">
                    {formatMemberSince(userDoc?.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Settings */}
            <div className="p-5 md:p-6 rounded-2xl bg-card border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                Appearance
              </h3>
              <div className="bg-accent/20 p-2 rounded-xl inline-flex gap-2 overflow-x-auto max-w-full">
                {[
                  { id: 'light', icon: Sun, label: 'Light' },
                  { id: 'dark', icon: Moon, label: 'Dark' },
                  { id: 'system', icon: Monitor, label: 'System' }
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => handleTheme(id)}
                    disabled={themeLoading}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                      ${userDoc?.theme === id
                        ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 md:p-8 rounded-3xl bg-card border border-border shadow-sm"
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Progress Overview
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Tasks Created', value: totalTasks, icon: Check, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Tasks Completed', value: completedTasks, icon: Award, color: 'text-green-500', bg: 'bg-green-500/10' },
              { label: 'Notes Added', value: totalNotes, icon: Edit3, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              { label: 'Current Streak', value: streak, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' }
            ].map((stat, i) => (
              <div key={i} className="p-5 rounded-2xl bg-accent/20 border border-border/50 hover:border-border transition-colors">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  <CountUp value={stat.value || 0} />
                </div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              Focus Activity
            </div>

            {/* New Heatmap Legend */}
            <div className="mb-6 p-4 rounded-xl bg-accent/10 border border-border/50">
              <div className="text-xs font-medium text-muted-foreground mb-3">Heatmap legend (tasks completed)</div>
              <div className="w-full h-3 rounded-full bg-[linear-gradient(to_right,#ffffff,#86efac,#22c55e,#f59e0b,#ef4444,#b91c1c)] mb-2 shadow-inner"></div>
              <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
                <span>0</span>
                <span>1-2</span>
                <span>3-4</span>
                <span>5-6</span>
                <span>7-9</span>
                <span>10+</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-2 text-center opacity-70">Color intensity shows number of tasks completed that day</div>
            </div>

            <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              <div className="min-w-[700px] h-[200px]">
                <ResponsiveCalendar
                  data={heatMapData}
                  from={new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]}
                  to={new Date().toISOString().split('T')[0]}
                  emptyColor={"var(--empty-cell-color)"}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  monthBorderColor="transparent"
                  dayBorderWidth={1}
                  dayBorderColor={"var(--cell-border-color)"}
                  daySpacing={4}
                  dayRadius={3}
                  monthSpacing={12}
                  monthLegendPosition="before"
                  monthLegendOffset={10}
                  square={true}
                  theme={{
                    textColor: 'var(--muted-foreground)',
                    fontSize: 11,
                    tooltip: {
                      container: {
                        background: 'var(--popover)',
                        color: 'var(--popover-foreground)',
                        fontSize: '12px',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        border: '1px solid var(--border)'
                      }
                    }
                  }}
                  minValue={0}
                  maxValue={10}
                  colorScale={getHeatmapColor}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col md:flex-row gap-4 justify-end pt-6 border-t border-border/50"
        >
          <button
            onClick={sendPasswordReset}
            className="group relative p-[2px] rounded-2xl overflow-hidden shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            <div className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#06b6d4_50%,#3b82f6_100%)]" />
            <div className="relative h-full w-full bg-white/90 dark:bg-gray-950/90 rounded-xl flex items-center justify-center gap-2 px-6 py-3 backdrop-blur-3xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Key className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Change Password</span>
            </div>
          </button>

          <button
            onClick={() => {
              toast.custom((t) => (
                <div className="w-full max-w-sm bg-popover/95 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl ring-1 ring-black/5">
                  <div className="text-lg font-semibold mb-2 text-foreground">Confirm Logout</div>
                  <p className="text-sm text-muted-foreground mb-6">Are you sure you want to log out of your account?</p>
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => toast.dismiss(t)} className="px-4 py-2 rounded-xl text-sm font-medium bg-muted hover:bg-muted/80 transition-colors">Cancel</button>
                    <button onClick={async () => { toast.dismiss(t); await auth.signOut(); window.location.href = '/'; }} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors">Logout</button>
                  </div>
                </div>
              ), { duration: Infinity });
            }}
            className="group relative p-[2px] rounded-2xl overflow-hidden shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            <div className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#f97316_0%,#ec4899_50%,#f97316_100%)]" />
            <div className="relative h-full w-full bg-white/90 dark:bg-gray-950/90 rounded-xl flex items-center justify-center gap-2 px-6 py-3 backdrop-blur-3xl">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <LogOut className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Logout</span>
            </div>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="group relative p-[2px] rounded-2xl overflow-hidden shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            <div className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#7f1d1d_0%,#ef4444_30%,#fbbf24_50%,#ef4444_70%,#7f1d1d_100%)]" />
            <div className="relative h-full w-full bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center gap-2 px-6 py-3 text-white backdrop-blur-3xl">
              <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-sm font-bold">Delete Account</span>
            </div>
          </button>
        </motion.div>
      </div >
    </div >
  );
}
