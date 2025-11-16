import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Add responsive styles
const styles = document.createElement('style');
styles.textContent = `
  /* Sprint filters responsiveness */
  @media (max-width: 640px) {
    .sprint-filters {
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
    }
    .sprint-filters select,
    .sprint-filters button {
      width: 100%;
      height: 2.5rem;
      font-size: 0.875rem;
    }
    .sprint-filters-row {
      display: flex;
      gap: 0.5rem;
      width: 100%;
    }
  }

  /* Custom scrollbar styles */
  .overflow-x-auto::-webkit-scrollbar {
    height: 8px;
  }
  
  .overflow-x-auto::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .overflow-x-auto::-webkit-scrollbar-thumb {
    background-color: var(--muted);
    border-radius: 4px;
  }

  .overflow-x-auto:hover::-webkit-scrollbar-thumb {
    background-color: var(--muted-foreground);
  }

  .overflow-x-auto {
    scrollbar-width: thin;
    scrollbar-color: var(--muted) transparent;
  }

  /* Scroll shadow indicators for horizontal scroll */
  .scroll-container {
    position: relative;
  }

  .scroll-container::before,
  .scroll-container::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 20px;
    pointer-events: none;
    z-index: 10;
    transition: opacity 0.3s;
  }

  .scroll-container::before {
    left: 0;
    background: linear-gradient(to right, var(--card), transparent);
  }

  .scroll-container::after {
    right: 0;
    background: linear-gradient(to left, var(--card), transparent);
  }

  /* Timer responsiveness - Enhanced */
  @media (max-width: 768px) {
    .gate-timer {
      gap: 0.75rem !important;
      padding: 0.75rem !important;
    }
    
    .gate-timer .tabular-nums {
      font-size: 1.5rem !important;
      line-height: 1.3 !important;
    }

    .gate-timer .text-[9px],
    .gate-timer .text-[10px],
    .gate-timer .text-xs {
      font-size: 0.7rem !important;
    }
  }

  @media (max-width: 480px) {
    .gate-timer {
      gap: 0.5rem !important;
      padding: 0.5rem !important;
    }
    
    .gate-timer .tabular-nums {
      font-size: 1.25rem !important;
      line-height: 1.2 !important;
    }

    .gate-timer .text-[9px],
    .gate-timer .text-[10px],
    .gate-timer .text-xs {
      font-size: 0.625rem !important;
    }
  }

  /* Extra small screens */
  @media (max-width: 360px) {
    .gate-timer {
      gap: 0.375rem !important;
      padding: 0.375rem !important;
    }

    .gate-timer .tabular-nums {
      font-size: 1.125rem !important;
      line-height: 1.1 !important;
    }

    .gate-timer .text-[9px],
    .gate-timer .text-[10px],
    .gate-timer .text-xs {
      font-size: 0.5625rem !important;
    }

    /* Remove rigid min-widths so digits can shrink naturally */
    .gate-timer .min-w-14,
    .gate-timer .min-w-10 {
      min-width: 0 !important;
    }

    /* Keep the numbers on one line and avoid wrapping */
    .gate-timer div { white-space: nowrap; }
  }

  /* Timer character centering + decorative line */
  .timer-char-wrapper { position: relative; }
  .timer-char-line {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: 0;
    width: 140px;
    height: 2px;
    border-radius: 2px;
    background: linear-gradient(90deg, rgba(124,58,237,0.16), rgba(6,182,212,0.12));
    box-shadow: 0 8px 28px rgba(124,58,237,0.04);
    pointer-events: none;
  }
  .timer-char-container {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: calc(100% + 6px);
    display: flex;
    align-items: center;
    justify-content: center;
    width: auto;
    height: auto;
    pointer-events: none;
  }

  /* Hide character on small screens */
  @media (max-width: 779px) {
    .timer-char-container { display: none !important; }
    .timer-char-line { display: none !important; }
  }

  /* Touch-friendly buttons - minimum 44x44px */
  @media (max-width: 768px) {
    .touch-target {
      min-width: 44px !important;
      min-height: 44px !important;
    }
  }

  /* Card padding adjustments for mobile */
  @media (max-width: 640px) {
    .card-mobile-padding {
      padding: 1rem !important;
    }
  }

  /* Improved task list item spacing on mobile */
  @media (max-width: 640px) {
    .task-item-mobile {
      padding: 1rem 0.75rem !important;
    }
  }

  /* Better dialog sizing on mobile */
  @media (max-width: 640px) {
    [role="dialog"] {
      max-width: calc(100vw - 2rem) !important;
      margin: 1rem !important;
    }
  }
`;
document.head.appendChild(styles);
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveCalendar } from '@nivo/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, CheckCircle2, Link as LinkIcon, TrendingUp, CalendarDays, BarChart3, ListTodo, RotateCcw, Rocket, Timer, Bug, BookOpen, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import MotivationCard from "@/components/MotivationCard";
import { ThemeToggle } from "@/components/theme-toggle";
import Mindmap from "@/Mindmap";
import ProfileDropdown from "@/components/ProfileDropdown";
import LoginPrompt from "@/components/LoginPrompt";
import LoadingSpinner from "@/components/LoadingSpinner";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, setDoc, updateDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { getUserData } from "./utils/getUserData";

// GATE Prep Dashboard v1.1 (JSX version)
// Complete JS (no TypeScript). Handles missing env vars safely and falls back to localStorage.

// ---------------- Env helpers (robust against undefined) ----------------
function getEnv(key) {
  try {
    const v = import.meta?.env?.[key];
    return typeof v === "string" && v.length > 0 ? v : undefined;
  } catch {
    return undefined;
  }
}

const ENV = {
  ENDPOINT: getEnv("VITE_APPWRITE_ENDPOINT"),
  PROJECT: getEnv("VITE_APPWRITE_PROJECT"),
  DB_ID: getEnv("VITE_APPWRITE_DATABASE_ID"),
  COL_ID: getEnv("VITE_APPWRITE_COLLECTION_ID"),
};

const APPWRITE_ENABLED = !!(ENV.ENDPOINT && ENV.PROJECT && ENV.DB_ID && ENV.COL_ID);
let appwriteClient = null;
let appwriteDB = null;

async function ensureAppwrite() {
  if (!APPWRITE_ENABLED) return false;
  if (appwriteClient && appwriteDB) return true;
  try {
    const { Client, Databases } = await import("appwrite");
    appwriteClient = new Client().setEndpoint(ENV.ENDPOINT).setProject(ENV.PROJECT);
    appwriteDB = new Databases(appwriteClient);
    return true;
  } catch (e) {
    console.warn("Appwrite SDK not available, using localStorage.");
    return false;
  }
}

// ---------------- Constants ----------------
const EXAM_SUBJECTS = {
  GATE: [
    "Engineering Mathematics",
    "Digital Logic",
    "Computer Organization",
    "Programming & DS",
    "Algorithms",
    "Theory of Computation",
    "Compiler Design",
    "Operating Systems",
    "Databases",
    "Computer Networks",
    "General",
    "Discrete Mathematics",
  ],
  "IIT-JEE": [
    "Physics Class 11",
    "Maths Class 11",
    "Chemistry Class 11",
    "Physics Class 12",
    "Maths Class 12",
    "Chemistry Class 12",
  ],
};

// Helper function to get subjects based on exam type
const getSubjectsForExam = (examType) => {
  return EXAM_SUBJECTS[examType] || EXAM_SUBJECTS.GATE; // Default to GATE if exam type not found
};

// Keep SUBJECTS as a helper (will be overridden by user's exam type)
let SUBJECTS = EXAM_SUBJECTS.GATE;

// ---------------- Storage Layer ----------------
// Tasks are now stored in Firestore in a subcollection: users/{uid}/tasks/{taskId}

async function storage_list() {
  // Fetch from Firebase subcollection
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('storage_list: No authenticated user');
      return [];
    }
    console.log(`storage_list: Fetching tasks for user ${currentUser.uid}`);
    const tasksRef = collection(db, "users", currentUser.uid, "tasks");
    const snap = await getDocs(tasksRef);
      const tasks = snap.docs.map(doc => ({
        // Ensure the authoritative Firestore document id is used as `id`.
        // Put doc.data() first, then override/add the id field with doc.id so
        // any `id` stored inside the document data doesn't replace the
        // real document id (which previously caused duplicate-upserts).
        ...doc.data(),
        id: doc.id,
      }));
    console.log(`storage_list: Successfully fetched ${tasks.length} tasks:`, tasks);
    return tasks;
  } catch (err) {
    console.error('storage_list ERROR:', {
      code: err.code,
      message: err.message,
      stack: err.stack,
      fullError: err
    });
    toast.error(`Failed to load tasks: ${err.message}`);
  }
  
  return [];
}

async function storage_create(task) {
  // Save to Firebase subcollection using setDoc with client-side ID to ensure consistency
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user for create');
    }
    if (!task.id) {
      throw new Error('Task must have an id before creating');
    }
    console.log(`storage_create: Creating task for user ${currentUser.uid}:`, task);
    const taskRef = doc(db, "users", currentUser.uid, "tasks", task.id);
    // Avoid storing the `id` inside the document data (it duplicates the
    // document id and can cause confusion). Persist the task fields except
    // the id property.
    const { id, ...taskData } = task;
    await setDoc(taskRef, {
      ...taskData,
      createdAt: new Date().toISOString(),
    });
    console.log(`storage_create: Task created with ID ${task.id}`);
    return;
  } catch (err) {
    console.error('storage_create ERROR:', {
      code: err.code,
      message: err.message,
      stack: err.stack,
      fullError: err
    });
    toast.error(`Failed to create task: ${err.message}`);
    throw err;
  }
}

async function storage_update(id, patch) {
  // Update in Firebase subcollection
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user for update');
    }
    console.log(`storage_update: Updating task ${id} for user ${currentUser.uid}:`, patch);
  const taskRef = doc(db, "users", currentUser.uid, "tasks", id);
  // Use setDoc with merge to avoid failures when the document doesn't exist
  // and to ensure partial updates are applied.
  await setDoc(taskRef, patch, { merge: true });
  console.log(`storage_update: Task ${id} upserted (set with merge) successfully`);
    return;
  } catch (err) {
    console.error('storage_update ERROR:', {
      code: err.code,
      message: err.message,
      stack: err.stack,
      fullError: err
    });
    toast.error(`Failed to update task: ${err.message}`);
    throw err;
  }
}

async function storage_delete(id) {
  // Delete from Firebase subcollection
  try {
    console.log('=== storage_delete START ===');
    const currentUser = auth.currentUser;
    console.log('Current user:', currentUser?.uid);
    
    if (!currentUser) {
      throw new Error('No authenticated user for delete');
    }
    
    console.log(`storage_delete: Deleting task ${id} for user ${currentUser.uid}`);
    const taskRef = doc(db, "users", currentUser.uid, "tasks", id);
    console.log('Task ref path:', `users/${currentUser.uid}/tasks/${id}`);
    
    await deleteDoc(taskRef);
    console.log(`storage_delete: Task ${id} deleted successfully from Firebase`);
    console.log('=== storage_delete SUCCESS ===');
    return;
  } catch (err) {
    console.error('=== storage_delete ERROR ===');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Full error object:', err);
    
    toast.error(`Failed to delete task: ${err.message}`);
    throw err;
  }
}

// ---------------- Helpers ----------------
function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Returns true if the task has been marked done and 6 hours have passed since completion
function isTaskLockedByTime(task) {
  try {
    if (!task) return false;
    if (task.status !== 'done') return false;
    if (!task.completedAt) return false;
    const completedTs = new Date(task.completedAt).getTime();
    if (Number.isNaN(completedTs)) return false;
    const elapsed = Date.now() - completedTs;
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    return elapsed >= SIX_HOURS;
  } catch (e) {
    return false;
  }
}

function humanDate(ymd) {
  const d = new Date(ymd + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
}

// ---------------- Component ----------------
export default function GATEDashboard() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(undefined); // undefined = loading, null = not authenticated, {} = authenticated
  const [authLoading, setAuthLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [subjects, setSubjects] = useState(EXAM_SUBJECTS.GATE); // Track subjects based on user's exam
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // tracks which task is being deleted
  const [savingTask, setSavingTask] = useState(null); // tracks which task is being updated (mark done)
  const [savingToastId, setSavingToastId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [showDiag, setShowDiag] = useState(false);
  const [mindOpen, setMindOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // form state
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [subject, setSubject] = useState();
  const [description, setDescription] = useState("");
  const [estMin, setEstMin] = useState("");
  const [date, setDate] = useState(todayYMD()); // Initialize with today's date

  useEffect(() => {
    (async () => {
      setTasksLoading(true);
      try {
        const list = await storage_list();
        setTasks(list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      } catch (e) {
        console.error(e);
        toast.error("Failed to load tasks");
      } finally {
        setTasksLoading(false);
      }
    })();
  }, []);

  // Fetch current user's exam from Firestore `users` collection and update header


 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      setAuthLoading(false);
      return;
    }

    try {
      // Ensure user document exists in Firestore (required for subcollections)
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create default user document if it doesn't exist
        console.log("Creating new user document for:", firebaseUser.uid);
        await setDoc(userRef, {
          exam: "GATE",
          createdAt: new Date().toISOString(),
        });
      }
      
      const data = userSnap.exists() ? userSnap.data() : { exam: "GATE", createdAt: new Date().toISOString() };
      console.log("User data:", data);
      
      // Update subjects based on user's exam type
      const examType = data.exam || "GATE";
      const updatedSubjects = getSubjectsForExam(examType);
      setSubjects(updatedSubjects);
      SUBJECTS = updatedSubjects;
      console.log(`Updated SUBJECTS for exam type: ${examType}`, updatedSubjects);
      
      setUser({ id: firebaseUser.uid, ...data });
      
      // After we establish the authenticated user, refresh tasks from Firestore
      // so the UI reflects the user's tasks immediately after sign-in.
      try {
        await refreshTasksFromStorage();
      } catch (e) {
        console.error('Failed to refresh tasks after auth change', e);
      }
    } catch (err) {
      console.error("Error in auth state change:", err);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  });

  return () => unsubscribe();
}, []);


  // useEffect(() => {
  //   const unsub = onAuthStateChanged(auth, async (user) => {
  //     if (!user) {
  //       setUserExam("GATE");
  //       return;
  //     }
  //     try {
  //       // First try the common pattern: a document in `users` collection with a `userId` field
  //       const q = query(collection(db, "users"), where("userId", "==", user.uid));
  //       const snap = await getDocs(q);
  //       if (!snap.empty) {
  //         const docData = snap.docs[0].data();
  //         console.debug('GATEDashboard: found user doc via userId field', docData);
  //         setUserExam(docData.exam || "GATE");
  //         return;
  //       }

  //       // Fallback: maybe the user document id is the uid (doc id == uid)
  //       try {
  //         const docRef = firestoreDoc(db, 'users', user.uid);
  //         const docSnap = await getDoc(docRef);
  //         if (docSnap && docSnap.exists()) {
  //           const data = docSnap.data();
  //           console.debug('GATEDashboard: found user doc by doc id', data);
  //           setUserExam(data.exam || "GATE");
  //           return;
  //         }
  //       } catch (e2) {
  //         console.debug('GATEDashboard: fallback doc-by-id lookup failed', e2);
  //       }

  //       // nothing found — keep default
  //       console.debug('GATEDashboard: no user document found for', user.uid);
  //       setUserExam("GATE");
  //     } catch (err) {
  //       console.error("Failed to fetch user exam", err);
  //       setUserExam("GATE");
  //     }
  //   });
  //   return () => unsub();
  // }, []);

  // Helper to refresh tasks from storage (authoritative source). Used after writes and when storage events
  async function refreshTasksFromStorage() {
    console.log('refreshTasksFromStorage: Starting...');
    try {
      console.log('refreshTasksFromStorage: Calling storage_list()');
      const list = await storage_list();
      console.log('refreshTasksFromStorage: Received list:', list);
      setTasks(list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      console.log('refreshTasksFromStorage: Tasks state updated');
    } catch (e) {
      console.error('refreshTasksFromStorage FAILED:', e);
    }
  }

  // Listen for cross-window storage changes so heatmap updates in real-time across tabs
  // Note: This is disabled since we're using Firebase now (not localStorage)
  // useEffect(() => {
  //   function onStorage(e) {
  //     if (e.key === LS_KEY) {
  //       refreshTasksFromStorage();
  //     }
  //   }
  //   window.addEventListener('storage', onStorage);
  //   return () => window.removeEventListener('storage', onStorage);
  // }, []);

  // Smoke tests (user-visible behavior unchanged)
  useEffect(() => {
    try {
      const k = "__gate_smoke__";
      localStorage.setItem(k, JSON.stringify({ ok: true }));
      JSON.parse(localStorage.getItem(k) || "{}");
      localStorage.removeItem(k);
    } catch (e) {
      console.warn("Smoke test warning:", e);
    }
  }, []);

  async function addTask() {
    if (isSaving) return; // prevent double submit
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const estimatedHours = estMin ? Number(estMin) / 60 : 0;
    const task = {
      id: uid(),
      title: title.trim(),
      link: link.trim() || null,  // null instead of undefined
      subject: subject || null,   // null instead of undefined
      description: description.trim() || null,  // null instead of undefined
      date: date, // use selected date from form
      status: "pending",
      createdAt: new Date().toISOString(),
      completedAt: null,
      estimatedMinutes: estMin ? Number(estMin) : null,
      studyHours: estimatedHours,
    };
    console.log('addTask: Created task object:', task);
    setIsSaving(true);
    try {
      await storage_create(task);
      // refresh authoritative list from storage so heatmap and other derived state stay consistent
      await refreshTasksFromStorage();
      setCreateOpen(false);
      setTitle("");
      setLink("");
      setSubject(undefined);
      setDescription("");
      setEstMin("");
      toast.success("Task created");
    } catch (e) {
      console.error('Failed to create task', e);
      toast.error('Failed to create task');
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleTask(id, checked, loadingToastId = null) {
    // Find existing task so we can preserve or derive study hours when marking done
    const existing = tasks.find((t) => t.id === id);
    // If user is trying to unmark a task that was completed >6 hours ago, block it
    if (!checked && existing && isTaskLockedByTime(existing)) {
      console.warn(`toggleTask: Attempt to unmark locked task ${id} denied`);
      toast.custom(
        (t) => (
          <div className="rounded-md bg-popover px-3 py-2 text-sm border">
            <div className="font-semibold text-popover-foreground">Action blocked</div>
            <div className="text-popover-foreground text-xs mt-1">This task was marked done more than 6 hours ago and cannot be unmarked.</div>
          </div>
        ),
        { duration: 6000 }
      );
      return;
    }
    const patch = {
      status: checked ? "done" : "pending",
      completedAt: checked ? new Date().toISOString() : null,
    };

    // If user marks the task done and there's no explicit studyHours, derive it
    // from estimatedMinutes (if present) so stats / heatmap remain useful.
    if (checked && existing) {
      const hasStudy = existing.studyHours !== undefined && existing.studyHours !== null;
      if (!hasStudy && existing.estimatedMinutes) {
        // store hours as fractional hours
        patch.studyHours = Number(existing.estimatedMinutes) / 60;
      }
    }

    // Indicate saving state for this task so UI can show spinner
    setSavingTask(id);
    try {
      await storage_update(id, patch);
    } finally {
      setSavingTask(null);
      // Dismiss the persistent loading toast passed from caller (if any)
      try {
        const idToDismiss = loadingToastId || savingToastId;
        if (idToDismiss) {
          toast.dismiss(idToDismiss);
        }
      } catch (e) {
        // ignore
      }
      // Clear stored id state
      try { setSavingToastId(null); } catch (e) {}
    }
    // optimistic UI update first
    setTasks((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    // then refresh from storage (authoritative) to update heatmap and across tabs
    await refreshTasksFromStorage();

    // After saving, show final toast informing about 6-hour lock if task was marked done
    if (checked) {
      toast.custom(
        (t) => (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="font-medium text-emerald-800 dark:text-emerald-200">Marked done</div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300">After 6 hours you will be unable to unmark, edit, or delete this task.</div>
              </div>
            </div>
          </div>
        ),
        { duration: 6000 }
      );
    }
  }

  // Wrapper to handle UI-level lock checks before toggling
  function handleToggle(task, v) {
    // if trying to uncheck (v === false) and task is locked, block
    if (!v && isTaskLockedByTime(task)) {
      console.warn(`handleToggle: Attempt to unmark locked task ${task.id} denied`);
      toast.custom(
        (t) => (
          <div className="rounded-md bg-popover px-3 py-2 text-sm border">
            <div className="font-semibold text-popover-foreground">Action blocked</div>
            <div className="text-popover-foreground text-xs mt-1">This task was marked done more than 6 hours ago and cannot be unmarked.</div>
          </div>
        ),
        { duration: 6000 }
      );
      return;
    }

    // Show immediate persistent loading toast and spinner when user clicks mark-as-done
    const loadingMessage = v ? 'Marking done...' : 'Saving...';
    const id = toast.loading(loadingMessage);
    setSavingToastId(id);
    setSavingTask(task.id);

    // proceed to perform the update and pass the loading toast id so it can be dismissed
    toggleTask(task.id, v, id);
  }

  async function deleteTask(id, taskTitle) {
    console.log('=== DELETE TASK INITIATED ===');
    console.log('Task ID:', id);
    console.log('Task Title:', taskTitle);
    // Prevent deleting if task is locked (completed > 6 hours ago)
    const existing = tasks.find((t) => t.id === id);
    if (existing && isTaskLockedByTime(existing)) {
      console.warn(`deleteTask: Attempt to delete locked task ${id} denied`);
      toast.custom(
        (t) => (
          <div className="rounded-md bg-popover px-3 py-2 text-sm border">
            <div className="font-semibold text-popover-foreground">Action blocked</div>
            <div className="text-popover-foreground text-xs mt-1">This task was marked done more than 6 hours ago and cannot be deleted.</div>
          </div>
        ),
        { duration: 6000 }
      );
      return;
    }
    
    // Show confirmation dialog with buttons
    const confirmed = await new Promise((resolve) => {
      console.log('Showing confirmation toast...');
      const toastId = toast.custom(
        (t) => (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg">
            <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-3">
              Delete "{taskTitle}"?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  console.log('Delete cancelled by user');
                  toast.dismiss(t);
                  resolve(false);
                }}
                className="px-3 py-1 text-sm rounded bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-100 hover:bg-red-300 dark:hover:bg-red-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Delete confirmed by user, proceeding...');
                  toast.dismiss(t);
                  resolve(true);
                }}
                className="px-3 py-1 text-sm rounded bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ),
        { duration: Infinity }
      );
    });

    if (!confirmed) {
      console.log(`deleteTask: User cancelled delete for task ${id}`);
      return;
    }

    // Mark this task as deleting so UI can disable the delete button and show a spinner
    setIsDeleting(id);
    console.log('User confirmed deletion, showing progress toast...');
    const progressToastId = toast.loading("Deleting task...");

    try {
      console.log(`deleteTask: Starting deletion for task ${id}`);
      await storage_delete(id);
      console.log(`deleteTask: storage_delete succeeded for task ${id}, refreshing tasks`);

      await refreshTasksFromStorage();
      console.log('deleteTask: Task list refreshed');

      toast.dismiss(progressToastId);
      toast.success("Task deleted successfully");
      console.log('=== DELETE TASK COMPLETED SUCCESSFULLY ===');
    } catch (error) {
      console.error('=== DELETE TASK FAILED ===');
      console.error("Delete error:", error);
      toast.dismiss(progressToastId);
      toast.error(`Failed to delete task: ${error.message}`);
    } finally {
      // ensure UI state is cleared regardless of outcome
      setIsDeleting(null);
    }
  }

  function startEditing(task) {
    if (isTaskLockedByTime(task)) {
      toast.custom(
        (t) => (
          <div className="rounded-md bg-popover px-3 py-2 text-sm border">
            <div className="font-semibold text-popover-foreground">Action blocked</div>
            <div className="text-popover-foreground text-xs mt-1">This task was marked done more than 6 hours ago and cannot be edited.</div>
          </div>
        ),
        { duration: 6000 }
      );
      return;
    }
    setEditingTask(task);
    setTitle(task.title);
    setLink(task.link || "");
    setSubject(task.subject);
    setDescription(task.description || "");
    setDate(task.date);
    setEstMin(task.estimatedMinutes?.toString() || "");
    setCreateOpen(true);
  }

  async function updateTask() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (isSaving) {
      return; // Prevent concurrent updates
    }
    setIsSaving(true);
    try {
      // Build patch WITHOUT the id field (Firestore doesn't allow updating document id)
      const updatedTask = {
        title: title.trim(),
        link: link.trim() || null,  // null instead of undefined
        subject: subject || null,   // null instead of undefined
        description: description.trim() || null,  // null instead of undefined
        date,
        estimatedMinutes: estMin ? Number(estMin) : null,
        status: editingTask.status,  // preserve original status
        completedAt: editingTask.completedAt,  // preserve original completedAt
        createdAt: editingTask.createdAt,  // preserve original createdAt
        studyHours: editingTask.studyHours,  // preserve original studyHours
      };
      console.log('updateTask: Updated task patch (without id):', updatedTask);
      await storage_update(editingTask.id, updatedTask);
      // refresh authoritative list
      await refreshTasksFromStorage();
      setCreateOpen(false);
      setEditingTask(null);
      resetForm();
      toast.success("Task updated");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update task");
    } finally {
      setIsSaving(false);
    }
  }

  function resetForm() {
    setTitle("");
    setLink("");
    setSubject(undefined);
    setDescription("");
    setEstMin("");
    setDate(todayYMD());
    setDescription("");
    setEstMin("");
  }

  // ---------------- Derived Data ----------------
  const today = todayYMD();
  const todaysTasks = tasks.filter((t) => t.date === today);
  const todaysDone = todaysTasks.filter((t) => t.status === "done");
  const todaysPct = todaysTasks.length ? Math.round((todaysDone.length / todaysTasks.length) * 100) : 0;

  const overallDone = tasks.filter((t) => t.status === "done").length;
  const overallPct = tasks.length ? Math.round((overallDone / tasks.length) * 100) : 0;

  // Heatmap shows number of tasks completed per day
  // Colors are assigned based on ranges: 1-2, 3-4, 5-6, 7-8, 9-10, 10+ tasks
  const heatMapData = useMemo(() => {
    const data = [];
    const dateMap = new Map();

    // Count completed tasks by their completion date
    tasks.forEach(t => {
      if (t.status === 'done' && t.completedAt) {
        const completionDate = t.completedAt.split('T')[0];
        const count = dateMap.get(completionDate) || 0;
        dateMap.set(completionDate, count + 1);
      }
    });

    // Convert the map to our final data format
    for (const [day, completedCount] of dateMap) {
      data.push({
        day,
        value: Number(completedCount), // Ensure it's a number for proper color mapping
        completedTasks: completedCount
      });
    }

    // Debug: log the computed heatMapData so we can inspect entries and percent values
    try {
      console.debug('heatMapData', data);
    } catch (e) {
      // ignore
    }
    return data;
  }, [tasks]);

  // Helper to get color based on number of completed tasks - green to red gradient
  const getHeatmapColor = (value) => {
    // For empty days or invalid values, return empty color
    if (!value || typeof value !== 'number') return 'var(--empty-cell-color)';

    // Color scale based on number of completed tasks
    const count = Math.floor(value);
    if (count === 0) return 'var(--empty-cell-color)';
    if (count <= 2) return '#86efac';        // Light green (1-2 tasks)
    if (count <= 4) return '#22c55e';        // Medium green (3-4 tasks)
    if (count <= 6) return '#f59e0b';        // Amber/Orange (5-6 tasks)
    if (count <= 9) return '#ef4444';        // Light red (7-9 tasks)
    return '#b91c1c';                        // Dark red (10+ tasks)

    // Color stops exactly matching the legend
    // 0% -> white/empty
    // 0-10% -> white to light green
    // 10-25% -> light green to medium green
    // 25-50% -> medium green to dark green
    // 50-90% -> dark green to light red
    // 90-100% -> light red to deep red

    let startColor, endColor, t;

    if (v <= 10) {
      startColor = hexToRgb('#ffffff');      // white
      endColor = hexToRgb('#d1fae5');        // light green
      t = v / 10;
    } else if (v <= 25) {
      startColor = hexToRgb('#d1fae5');      // light green
      endColor = hexToRgb('#34d399');        // medium green
      t = (v - 10) / 15;
    } else if (v <= 50) {
      startColor = hexToRgb('#34d399');      // medium green
      endColor = hexToRgb('#16a34a');        // dark green
      t = (v - 25) / 25;
    } else if (v <= 90) {
      startColor = hexToRgb('#16a34a');      // dark green
      endColor = hexToRgb('#fecaca');        // light red
      t = (v - 50) / 40;
    } else {
      startColor = hexToRgb('#fecaca');      // light red
      endColor = hexToRgb('#ef4444');        // deep red
      t = (v - 90) / 10;
    }

    const r = lerp(startColor[0], endColor[0], t);
    const g = lerp(startColor[1], endColor[1], t);
    const b = lerp(startColor[2], endColor[2], t);
    const color = rgbToHex(r, g, b);

    // Defensive fallback: if color is malformed, return a safe green
    if (!color || typeof color !== 'string' || !/^#([0-9a-fA-F]{6})$/.test(color)) {
      try { console.warn('colorForPercent produced invalid color, falling back', { value: v, r, g, b, color }); } catch (e) { }
      return '#16a34a';
    }

    // Debug: log value -> color mapping to diagnose black tile cases
    try { console.debug('colorForPercent', { value: v, color, r, g, b }); } catch (e) { }
    return color;
  };

  const weeklyTrendData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      // Only count tasks that were completed on this date
      const completedTasks = tasks.filter(t =>
        t.status === 'done' &&
        t.completedAt &&
        t.completedAt.split('T')[0] === ymd
      );

      data.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        done: completedTasks.length // Only track completed tasks
      });
    }
    return data;
  }, [tasks]);

  const filteredTasks = tasks.filter((t) => {
    const statusOk = filter === "all" ? true : t.status === filter;
    const subjectOk = subjectFilter === "all" ? true : (t.subject === subjectFilter);
    return statusOk && subjectOk;
  });

  // Subject-wise completion
  const subjectStats = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      const key = t.subject || "General";
      const s = map.get(key) || { total: 0, done: 0 };
      s.total += 1;
      if (t.status === "done") s.done += 1;
      map.set(key, s);
    }
    return Array.from(map.entries())
      .map(([name, s]) => ({ name, pct: s.total ? Math.round((s.done / s.total) * 100) : 0, total: s.total, done: s.done }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  // Streak: consecutive days ending today where at least 1 task was completed
  const streak = useMemo(() => {
    if (!tasks.length) return 0;
    const set = new Set();
    for (const t of tasks) {
      if (t.status === "done" && t.completedAt) {
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

  // Weekly trend calculation is now handled by weeklyTrendData

  const motivational = todaysPct === 100
    ? "Beast mode! Aaj ka target pura."
    : todaysPct >= 60
      ? "Great momentum—bas thoda aur push!"
      : todaysTasks.length === 0
        ? "Add 2–3 quick wins to kickstart the day."
        : "Small steps > No steps. Keep going!";

  // GATE Timer and Progress
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [journeyProgress, setJourneyProgress] = useState(0);

  // Helper function to check if a URL is a YouTube link
  const isYouTubeLink = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be');
  };

  // Constants for journey tracking
  const GATE_START_DATE = new Date('2023-11-08');
  const GATE_END_DATE = new Date('2026-02-07');
  const TOTAL_JOURNEY_DAYS = Math.ceil((GATE_END_DATE - GATE_START_DATE) / (1000 * 60 * 60 * 24));

  //Extracting months, days and years from firebase fetched user-data
  // Extract and normalize exam date (stored in Firestore as string 'YYYY-MM-DD' or as Date)
  const rawExamDate = user?.examDate;

  // Helper: parse YYYY-MM-DD reliably into a Date (local midnight)
  const parseYMD = (s) => {
    if (typeof s !== 'string') return null;
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (Number.isNaN(y) || Number.isNaN(mo) || Number.isNaN(d)) return null;
    // Use Date(year, monthIndex, day) to avoid timezone parsing quirks of Date(string)
    return new Date(y, mo - 1, d);
  };

  let examDateObj = null;
  if (!rawExamDate) {
    examDateObj = null;
  } else if (rawExamDate instanceof Date) {
    examDateObj = rawExamDate;
  } else if (typeof rawExamDate === 'string') {
    examDateObj = parseYMD(rawExamDate) || (isNaN(Date.parse(rawExamDate)) ? null : new Date(rawExamDate));
  } else {
    // unexpected shape
    try {
      examDateObj = new Date(rawExamDate);
      if (Number.isNaN(examDateObj.getTime())) examDateObj = null;
    } catch (e) {
      examDateObj = null;
    }
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const day = examDateObj ? String(examDateObj.getDate()).padStart(2, "0") : "--";
  const month = examDateObj ? String(examDateObj.getMonth() + 1).padStart(2, "0") : "--"; // +1 because 0 = Jan
  const year = examDateObj ? examDateObj.getFullYear() : "----";
  const monthName = examDateObj ? monthNames[examDateObj.getMonth()] : "";

//Logic for timer countdown

  useEffect(() => {
    // Depend on the raw exam date string and createdAt string (primitives) to avoid
    // re-running when a new Date object is created each render.
    function updateTimer() {
      // Re-parse exam date from the raw string inside the effect
      const parsedExam = rawExamDate ? parseYMD(rawExamDate) || (isNaN(Date.parse(rawExamDate)) ? null : new Date(rawExamDate)) : null;
      const gateDateMs = parsedExam ? parsedExam.getTime() : null;

      if (!gateDateMs) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      // Live countdown from now until exam date
      let diff = gateDateMs - Date.now();

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }

    updateTimer(); // Initial update
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [rawExamDate]);

if (authLoading) return <LoadingSpinner />;
if (user === null) return <LoginPrompt />;


  return (
    <div className="min-h-screen bg-background transition-colors dark:bg-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{user?.exam?.toUpperCase?.() || "_"} Prep Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
              {humanDate(today)} • {user?.name || "Guest"}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 sm:gap-2.5 md:gap-3">
            {/* Theme Toggle */}
            <div className="shrink-0">
              <ThemeToggle />
            </div>

            {/* Streak Badge **********************************/}
            <Badge
              variant="secondary"
              className="
      text-sm flex items-center gap-1 cursor-pointer
      whitespace-nowrap px-3 py-1.5
    "
              onClick={() => setShowDiag(!showDiag)}
            >
              <Rocket className="h-3.5 w-3.5" /> Streak: {streak}d
            </Badge>

            {/* Mindmap Dialog */}
            <Dialog open={mindOpen} onOpenChange={setMindOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="
          gap-2 flex items-center justify-center
          text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2
          w-auto min-w-[110px]
        "
                >
                  <Rocket className="h-4 w-4 hidden xs:inline-block" /> Mindmap
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-5xl md:max-w-6xl">
                <DialogHeader>
                  <DialogTitle>Tasks Mindmap</DialogTitle>
                </DialogHeader>
                <Mindmap tasks={tasks} toggleTask={toggleTask} />
              </DialogContent>
            </Dialog>

            {/* Create Flow Dialog */}
            <Dialog
              open={createOpen}
              onOpenChange={(open) => {
                setCreateOpen(open);
                // When dialog closes, clear editing state so subsequent Create opens an empty form
                if (!open) {
                  setEditingTask(null);
                  resetForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    // Ensure Create always opens an empty form (clear any previous edit state)
                    setEditingTask(null);
                    resetForm();
                  }}
                  className="
          gap-2 flex items-center justify-center
          text-sm sm:text-base
          px-3 py-1.5 sm:px-4 sm:py-2
          w-auto min-w-[120px]
        "
                >
                  <Plus className="h-4 w-4" /> Create Flow
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
                  <DialogDescription>
                    {editingTask
                      ? 'Update your study item details.'
                      : 'Add your study item with link and subject.'}
                  </DialogDescription>
                </DialogHeader>

                {/* Form Fields */}
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., OS – Deadlocks revision"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="link">Link</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="link"
                        placeholder="YouTube/GFG/Notes URL"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                      />
                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Subject</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="max-w-[200px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="est">Est. Minutes</Label>
                      <Input
                        id="est"
                        type="number"
                        min={0}
                        placeholder="e.g., 45"
                        value={estMin}
                        onChange={(e) => setEstMin(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="desc">Notes</Label>
                      <Textarea
                        id="desc"
                        placeholder="Quick notes / DPP / PYQ focus"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCreateOpen(false);
                        setEditingTask(null);
                        resetForm();
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>

                    <Button
                      onClick={editingTask ? updateTask : addTask}
                      className="gap-2 w-full sm:w-auto"
                      disabled={isSaving}
                    >
                      {editingTask ? (
                        isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                              <polyline points="17 21 17 13 7 13 7 21" />
                              <polyline points="7 3 7 8 15 8" />
                            </svg>
                            Save Changes
                          </>
                        )
                      ) : isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" /> Create
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Profile Dropdown - Rightmost Position */}
            <div className="shrink-0">
              <ProfileDropdown />
            </div>
          </div>

        </div>

        {/* Timer Section with Stats */}
        <div className="grid grid-cols-12 gap-4">
          {/* Study Focus Card */}
          <Card className="shadow-sm bg-card text-card-foreground dark:border-slate-800 overflow-hidden col-span-12 md:col-span-3 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 group">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                  <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary transition-colors duration-300 group-hover:text-primary/90" />
                </div>
                <span className="transition-colors duration-300 group-hover:text-primary">Study Focus</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col min-h-20 sm:h-20">
                <div className="mb-2">
                  <div className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                    <span>Active Topics</span>
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted/50">
                      {tasks.filter(t => t.status === 'pending' && t.subject).length} pending
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Latest subjects in progress</div>
                </div>
                <div className="space-y-1.5">
                  {tasks
                    .filter(t => t.status === 'pending' && t.subject)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 3)
                    .map(t => (
                      <div key={t.id}
                        className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5 group-hover:text-primary/90 transition-colors bg-muted/30 rounded-md px-2 py-1">
                        <BookOpen className="h-3 w-3 text-primary/60 shrink-0" />
                        <span className="truncate">{t.subject}</span>
                      </div>
                    ))
                  }
                </div>
                <div className="mt-auto pt-2 text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span>{todaysTasks.filter(t => t.status === 'done').length} completed today</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GATE Timer Card */}
          <Card className="shadow-sm bg-card text-card-foreground dark:border-slate-800 overflow-hidden relative col-span-12 md:col-span-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 group">
            <div className="absolute inset-0 bg-linear-to-r from-primary/5 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/30 group-hover:rotate-12">
                  <Timer className="h-5 w-5 text-primary transition-all duration-300 group-hover:text-primary" />
                </div>
                <span className="transition-colors duration-300 group-hover:text-primary">{user?.exam} {year}</span>
              </CardTitle>
              <Badge variant="secondary" className="text-sm font-normal transition-all duration-300 group-hover:bg-primary/10">
                {user?.examDate}
              </Badge>
            </CardHeader>
            <CardContent className="pb-5">
              {/* Countdown Timer********************************************/}
              <div className="gate-timer flex flex-row justify-between md:justify-center items-center px-2 sm:px-4 md:px-0 gap-0.5 sm:gap-2 md:gap-4 lg:gap-8 py-3">
                <div className="text-center min-w-14 sm:min-w-0">
                  <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold tabular-nums">{timeLeft.days}</div>
                  <div className="text-[9px] sm:text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">days</div>
                </div>
                <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-muted-foreground">:</div>
                <div className="text-center min-w-10 sm:min-w-0">
                  <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold tabular-nums">{timeLeft.hours}</div>
                  <div className="text-[9px] sm:text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">hrs</div>
                </div>
                <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-muted-foreground">:</div>
                <div className="text-center min-w-10 sm:min-w-0">
                  <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold tabular-nums">{timeLeft.minutes}</div>
                  <div className="text-[9px] sm:text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">min</div>
                </div>
                <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-muted-foreground">:</div>
                <div className="text-center min-w-10 sm:min-w-0">
                  <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold tabular-nums">{timeLeft.seconds}</div>
                  <div className="text-[9px] sm:text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">sec</div>
                </div>
              </div>
              {/* Journey Progress */}
              <div className="flex flex-col items-center justify-center gap-2 my-4">
                <div className="w-48 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-primary/40 to-primary transition-all duration-500 ease-out"
                    style={{ width: `${journeyProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(journeyProgress)}% of journey completed
                </p>
              </div>
              <div className="relative timer-char-wrapper">
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-sm text-muted-foreground">
                    {timeLeft.days > 100
                      ? "Keep pushing! Every day of focused study compounds."
                      : timeLeft.days > 30
                        ? "Final stretch — you've got this! 💪"
                        : "It's game time! You were born for this. 🚀"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Motivation Video Card */}
          <MotivationCard />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="shadow-sm bg-card text-card-foreground dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const tasksCompletedToday = tasks.filter(t =>
                  t.status === "done" &&
                  t.completedAt &&
                  t.completedAt.split('T')[0] === todayYMD()
                ).length;

                // Calculate progress percentage (0-8 tasks = 0-100%)
                const progressPercentage = Math.min(100, (tasksCompletedToday / 8) * 100);

                return (
                  <>
                    <div className="text-2xl font-bold">
                      {tasksCompletedToday}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">hits today</p>
                    <div className="relative w-full h-2 rounded-full overflow-hidden bg-[#ebedf0] dark:bg-[#161b22]">
                      <div
                        className="absolute h-full transition-all duration-300 rounded-full"
                        style={{
                          width: `${progressPercentage}%`,
                          background: tasksCompletedToday === 0
                            ? '#ebedf0'
                            : tasksCompletedToday <= 2
                              ? '#9be9a8'
                              : tasksCompletedToday <= 4
                                ? '#40c463'
                                : tasksCompletedToday <= 6
                                  ? '#30a14e'
                                  : '#216e39'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>0</span>
                      <span>2</span>
                      <span>4</span>
                      <span>6</span>
                      <span>8+</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {tasksCompletedToday} tasks completed • {motivational}
                    </p>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-card text-card-foreground dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Overall</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallDone}/{tasks.length}</div>
              <p className="text-sm text-muted-foreground mb-2">total completed</p>
              <Progress value={overallPct} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{overallPct}% done overall</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-card text-card-foreground dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Weekly Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[110px]">
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={weeklyTrendData} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="currentColor" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="currentColor" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      color: 'var(--popover-foreground)'
                    }}
                    labelStyle={{
                      color: 'var(--muted-foreground)'
                    }}
                    itemStyle={{
                      color: 'var(--popover-foreground)'
                    }}
                    labelFormatter={(label, data) => {
                      return data[0]?.payload?.fullDate || label;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="done"
                    name="Completed"
                    stroke="currentColor"
                    fillOpacity={1}
                    fill="url(#colorDone)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Main */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Title */}
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                  <ListTodo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Your Sprints
                </CardTitle>

                {/* Filters Container */}
                <div className="flex flex-col xs:flex-row gap-2">
                  {/* Select Filters */}
                  <div className="flex flex-wrap gap-2">
                    {/* Status Filter */}
                    <Select value={filter} onValueChange={(v) => setFilter(v)}>
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-[110px] sm:w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Subject Filter */}
                    <Select value={subjectFilter} onValueChange={(v) => setSubjectFilter(v)}>
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-[140px] sm:w-[180px]">
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : filteredTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground">No tasks. Click “Create Task” to add your first item.</div>
              ) : (
                <div className={filteredTasks.length > 4 ? "max-h-64 overflow-y-auto" : ""}>
                  <ul className="divide-y divide-border">
                    {filteredTasks.map((t) => (
                      <li key={t.id} className="py-3 px-3 -mx-3 first:rounded-t-lg last:rounded-b-lg border-b border-border last:border-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="pt-0.5">
                            {savingTask === t.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                              <Checkbox
                                checked={t.status === "done"}
                                onCheckedChange={(v) => handleToggle(t, !!v)}
                                disabled={savingTask === t.id}
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className={`font-medium truncate ${t.status === "done" ? "text-muted-foreground line-through" : ""}`}>
                              {t.title}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center flex-wrap gap-2 mt-0.5">
                              {t.subject ? <Badge variant="secondary">{t.subject}</Badge> : null}
                              {t.estimatedMinutes ? (
                                <span className="inline-flex items-center gap-1">
                                  <Timer className="h-3 w-3" />{t.estimatedMinutes}m
                                </span>
                              ) : null}
                              {t.link ? (
                                <button
                                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors bg-transparent border-0 p-0"
                                  onClick={() => {
                                    if (isYouTubeLink(t.link)) {
                                      window.location.href = `/player?taskId=${t.id}`;
                                    } else {
                                      window.open(t.link, '_blank');
                                    }
                                  }}
                                >
                                  <LinkIcon className="h-3 w-3" /> Open
                                </button>
                              ) : null}
                            </div>
                            {t.description ? (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEditing(t)}
                            disabled={isTaskLockedByTime(t)}
                            title={isTaskLockedByTime(t) ? 'Cannot edit task after 6 hours of completion' : undefined}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => deleteTask(t.id, t.title)}
                            disabled={isDeleting === t.id || isTaskLockedByTime(t)}
                            title={isTaskLockedByTime(t) ? 'Cannot delete task after 6 hours of completion' : undefined}
                          >
                            {isDeleting === t.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                            )}
                          </Button>
                        </div>
                      </div>
                    </li>
    ))}

  </ul>

  </div>

)}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Subject Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {subjectStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet. Add tasks with subjects to see progress.</p>
              ) : (
                <div className="space-y-3">
                  {subjectStats.map((s) => (
                    <div key={s.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground">{s.done}/{s.total} • {s.pct}%</span>
                      </div>
                      <Progress value={s.pct} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Motivation + Diagnostics */}
        <Card className="shadow-sm col-span-full">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Study Contributions
              </CardTitle>
              <div className="flex items-center gap-1.5 text-xs text-[#24292f] dark:text-[#7d8590] font-medium">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#ebedf0] dark:bg-[#161b22] border border-[#0000001a] dark:border-[#ffffff1a]"></div>
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#9be9a8] dark:bg-[#40c463] border border-[#0000001a] dark:border-[#ffffff1a]"></div>
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#40c463] dark:bg-[#2ea043] border border-[#0000001a] dark:border-[#ffffff1a]"></div>
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#30a14e] dark:bg-[#216e39] border border-[#0000001a] dark:border-[#ffffff1a]"></div>
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#216e39] dark:bg-[#0d4429] border border-[#0000001a] dark:border-[#ffffff1a]"></div>
                </div>
                <span>More</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-6">
            <div className="px-3">
              {/* Legend above calendar to avoid overlap */}
              <div className="mb-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">Heatmap legend (tasks completed)</div>
                <div className="w-full h-3 rounded-md overflow-hidden" style={{ background: 'linear-gradient(to right, #ffffff 0%, #86efac 20%, #22c55e 40%, #f59e0b 60%, #ef4444 80%, #b91c1c 100%)' }} />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>0</span>
                  <span>1-2</span>
                  <span>3-4</span>
                  <span>5-6</span>
                  <span>7-9</span>
                  <span>10+</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">Color intensity shows number of tasks completed that day</div>
              </div>
              <div className="scroll-container overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] pb-2">
                <div className="relative h-[220px] min-w-[600px] w-full">
                  <ResponsiveCalendar
                    data={heatMapData}
                    from={new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]}
                    to={new Date().toISOString().split('T')[0]}
                    emptyColor={"var(--empty-cell-color)"}
                    colors={(v) => {
                      const val = v && typeof v === 'object' ? (v.value ?? v.data?.value) : v;
                      return colorForPercent(val);
                    }}
                    margin={{ top: 30, right: 32, bottom: 20, left: 40 }}
                    monthBorderColor="transparent"
                    dayBorderWidth={1}
                    dayBorderColor={"var(--cell-border-color)"}
                    daySpacing={4}
                    dayRadius={3}
                    monthSpacing={12}
                    monthLegendPosition="before"
                    monthLegendOffset={10}
                    monthLegendTicks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}
                    square={true}
                    theme={{
                      textColor: 'var(--muted-foreground)',
                      fontSize: 10,
                      labels: {
                        text: {
                          fill: 'var(--muted-foreground)',
                          fontSize: 10
                        }
                      }
                    }}
                    minValue={0}
                    maxValue={10}
                    colorScale={getHeatmapColor}
                    tooltip={({ value, day }) => {
                      const completedTasks = value || 0;
                      return (
                        <div className="rounded-md bg-popover px-3 py-1.5 text-xs border shadow-md">
                          <div className="font-semibold text-popover-foreground">
                            {completedTasks > 0
                              ? `${completedTasks} ${completedTasks === 1 ? 'task' : 'tasks'} completed`
                              : 'No tasks completed'} on {new Date(day).toLocaleDateString('en-US', {
                                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                              })}
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4" />
                <p className="text-muted-foreground">Tip: Break big topics into 25–40 min tasks. Track small wins to build consistency.</p>
              </div>
              {showDiag && (
                <div className="flex items-center gap-2 text-xs">
                  <Bug className="h-3.5 w-3.5" />
                  <span>Backend: {APPWRITE_ENABLED ? "Appwrite" : "LocalStorage"}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="text-xs text-muted-foreground text-center pt-2">
          v1.1 • React + Tailwind • Firebase optional (fallback to localStorage)
        </div>
      </div>
    </div>
  );
}
