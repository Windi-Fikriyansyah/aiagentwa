"use client";

import { useState, useEffect } from "react";
import { Plug, Save, CheckCircle2, AlertCircle } from "lucide-react";

export default function IntegrationsPage() {
  const [mayarApiKey, setMayarApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  useEffect(() => {
    fetchMayarApiKey();
  }, []);

  const fetchMayarApiKey = async () => {
    try {
      const res = await fetch("/api/integrations/mayar");
      if (res.ok) {
        const data = await res.json();
        setMayarApiKey(data.mayarApiKey || "");
      }
    } catch (error) {
      console.error("Failed to fetch Mayar API Key", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus({ type: null, message: "" });

    try {
      const res = await fetch("/api/integrations/mayar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mayarApiKey }),
      });

      if (res.ok) {
        setStatus({ type: "success", message: "API Key saved successfully!" });
      } else {
        const errorData = await res.json();
        setStatus({ type: "error", message: errorData.error || "Failed to save API Key" });
      }
    } catch (error) {
      setStatus({ type: "error", message: "An unexpected error occurred" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatus({ type: null, message: "" }), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-on-surface flex items-center gap-3">
          <Plug className="text-primary" size={32} />
          Integrations
        </h1>
        <p className="text-secondary mt-2">Connect AgentFlow AI to your favorite external services.</p>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-outline-variant/20">
                {/* Simulated Mayar Logo */}
                <span className="font-bold text-xl text-blue-600">M</span>
              </div>
              <h2 className="text-xl font-semibold text-on-surface">Mayar.id Integration</h2>
            </div>
            <p className="text-secondary leading-relaxed">
              Automate your unpaid transactions follow-up. By providing your Mayar API Key, 
              the AI agent will automatically detect pending payments and send friendly WhatsApp reminders.
            </p>
          </div>
        </div>

        <div className="space-y-4 max-w-2xl relative z-10 pt-4 border-t border-outline-variant/30">
          <div>
            <label htmlFor="mayarApiKey" className="block text-sm font-medium text-on-surface mb-2">
              Mayar API Key
            </label>
            <div className="relative">
              <input
                id="mayarApiKey"
                type="password"
                value={mayarApiKey}
                onChange={(e) => setMayarApiKey(e.target.value)}
                placeholder="Paste your Mayar API key here..."
                className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                disabled={isLoading || isSaving}
              />
            </div>
            <p className="text-xs text-secondary mt-2">
              You can find your API key in the Mayar Dashboard under Settings &gt; Developers.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save Configuration"}
            </button>

            {status.type === "success" && (
              <div className="flex items-center gap-2 text-green-500 animate-fade-in">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">{status.message}</span>
              </div>
            )}
            
            {status.type === "error" && (
              <div className="flex items-center gap-2 text-red-500 animate-fade-in">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">{status.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
