import { useState, useEffect } from "react";

const WAGE_RATES = { full: 1, half: 0.5, absent: 0 };

const initialWorkers = [
  { id: 1, name: "Ramesh Kumar", dailyWage: 400 },
  { id: 2, name: "Sunita Bai", dailyWage: 350 },
  { id: 3, name: "Mohan Lal", dailyWage: 450 },
];

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function App() {
  const [screen, setScreen] = useState("home"); // home, attendance, workers, addWorker, report
  const [workers, setWorkers] = useState(() => {
    try { return JSON.parse(localStorage.getItem("workers")) || initialWorkers; } catch { return initialWorkers; }
  });
  const [attendance, setAttendance] = useState(() => {
    try { return JSON.parse(localStorage.getItem("attendance")) || {}; } catch { return {}; }
  });
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [newWorker, setNewWorker] = useState({ name: "", dailyWage: "" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    localStorage.setItem("workers", JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem("attendance", JSON.stringify(attendance));
  }, [attendance]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function markAttendance(workerId, status) {
    setAttendance(prev => ({
      ...prev,
      [selectedDate]: { ...(prev[selectedDate] || {}), [workerId]: status }
    }));
  }

  function getStatus(workerId) {
    return (attendance[selectedDate] || {})[workerId] || null;
  }

  function addWorker() {
    if (!newWorker.name.trim() || !newWorker.dailyWage) {
      showToast("❌ Naam aur daily wage bharo"); return;
    }
    const w = { id: Date.now(), name: newWorker.name.trim(), dailyWage: Number(newWorker.dailyWage) };
    setWorkers(prev => [...prev, w]);
    setNewWorker({ name: "", dailyWage: "" });
    showToast("✅ Worker add ho gaya!");
    setScreen("workers");
  }

  function deleteWorker(id) {
    if (window.confirm("Is worker ko delete karein?")) {
      setWorkers(prev => prev.filter(w => w.id !== id));
      showToast("Worker delete ho gaya");
    }
  }

  // Calculate total earnings for a worker
  function workerTotal(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return 0;
    let total = 0;
    Object.entries(attendance).forEach(([date, dayData]) => {
      const status = dayData[workerId];
      if (status) total += worker.dailyWage * WAGE_RATES[status];
    });
    return total;
  }

  // Get report for a date range
  function getMonthReport() {
    const month = selectedDate.slice(0, 7);
    const days = Object.keys(attendance).filter(d => d.startsWith(month));
    return workers.map(worker => {
      let present = 0, half = 0, absent = 0, earned = 0;
      days.forEach(d => {
        const s = (attendance[d] || {})[worker.id];
        if (s === "full") { present++; earned += worker.dailyWage; }
        else if (s === "half") { half++; earned += worker.dailyWage * 0.5; }
        else if (s === "absent") absent++;
      });
      return { ...worker, present, half, absent, earned, days: days.length };
    });
  }

  const statusStyle = (status, current) => ({
    padding: "8px 16px",
    borderRadius: 20,
    border: "2px solid",
    borderColor: current === status ? (status === "full" ? "#16a34a" : status === "half" ? "#d97706" : "#dc2626") : "#e5e7eb",
    background: current === status ? (status === "full" ? "#dcfce7" : status === "half" ? "#fef3c7" : "#fee2e2") : "#fff",
    color: current === status ? (status === "full" ? "#16a34a" : status === "half" ? "#d97706" : "#dc2626") : "#9ca3af",
    fontWeight: current === status ? 700 : 400,
    cursor: "pointer",
    fontSize: 13,
  });

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif", position: "relative" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#1e293b", color: "#fff", padding: "10px 24px", borderRadius: 24, zIndex: 999, fontSize: 14, boxShadow: "0 4px 20px #0004" }}>
          {toast
