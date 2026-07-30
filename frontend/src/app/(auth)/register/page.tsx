"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Mail, Lock, User } from "lucide-react";
import { registerUser } from "./actions";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await registerUser(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant/30">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Bot size={32} className="text-primary" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2">Buat Akun</h1>
        <p className="text-center text-secondary mb-8">Mulai gunakan AgentFlow AI</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
              <input 
                name="name"
                type="text"
                required
                className="w-full pl-12 pr-4 py-3 bg-transparent border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="Nama Anda"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
              <input 
                name="email"
                type="email"
                required
                className="w-full pl-12 pr-4 py-3 bg-transparent border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="email@perusahaan.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
              <input 
                name="password"
                type="password"
                required
                className="w-full pl-12 pr-4 py-3 bg-transparent border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-70"
          >
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-secondary">
          Sudah punya akun? <Link href="/login" className="text-primary font-bold hover:underline">Masuk</Link>
        </div>
      </div>
    </div>
  );
}
