"use client";

import { useState } from "react";
import { updateProfile } from "./actions";
import { 
  Bot, 
  LayoutDashboard, 
  MessageSquare, 
  Puzzle, 
  Settings, 
  UserCircle, 
  CircleHelp, 
  Search, 
  Bell, 
  ArrowUpCircle, 
  User, 
  Edit3, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  ChevronRight, 
  SlidersHorizontal, 
  Globe, 
  RotateCcw, 
  AlertTriangle, 
  History, 
  BadgeCheck, 
  Database 
} from "lucide-react";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  timezone: string;
  language: string;
  emailNotifications: boolean;
  waNotifications: boolean;
  pushNotifications: boolean;
  twoFactor: boolean;
  openrouterApiKey?: string;
  openrouterModel?: string;
  openrouterEmbedModel?: string;
};

export default function SettingsForm({ initialProfile }: { initialProfile: Profile }) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProfile(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'radio') {
      setProfile(prev => ({ ...prev, [name]: value }));
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("Menyimpan...");
    try {
      await updateProfile(profile);
      setSaveMessage("Berhasil Disimpan!");
    } catch (err) {
      setSaveMessage("Gagal Menyimpan");
    }
    
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage("");
    }, 2000);
  };

  return (
    <>
        <div className="w-full space-y-stack-lg">
          
          {/* Hero Header Section */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-outline-variant">
            <div className="space-y-1">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Kelola Akun Anda</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Perbarui detail profil, amankan akun, dan atur preferensi aplikasi Anda di sini.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-2 border border-outline text-on-surface-variant rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors">Batalkan</button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className={`px-6 py-2 text-on-primary rounded-lg font-label-md text-label-md shadow-sm transition-all active:scale-95 ${saveMessage === 'Berhasil Disimpan!' ? 'bg-green-600' : 'bg-primary'} ${isSaving ? 'opacity-70' : 'hover:shadow-md'}`}
              >
                {saveMessage || "Simpan Perubahan"}
              </button>
            </div>
          </section>

          {/* Bento Grid Layout for Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            {/* Profile Information: Main Column */}
            <div className="lg:col-span-8 space-y-gutter">
              <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <User className="text-primary" size={24} />
                  <h3 className="font-headline-md text-headline-md">Informasi Profil</h3>
                </div>
                
                <div className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-8 p-4 bg-surface-container-low rounded-lg border border-dashed border-outline">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface-container-lowest shadow-sm">
                        <img className="w-full h-full object-cover" alt="Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIH-R3uqwkkS2HNkv2Hm5v859cDZkZSKEgv13irU_aHmbN6FXxqzfGBnxxZbNAGLHSIzPgc_Kaar6BPL_lAroSNQ7V02uVONm4LkoebyJFRZ1FEBnwBVLvJP75wmV8KDcXQzyRAcK0psdI-FnpZTnUUF9RKhwG3gkk_VswmYsypqWkUryyZutHDzZ-IpUyTfDammV1-raNMn4U945kiJHhLW8OWisfOeeHCQQPvkXhunE6QN9SSbf3RQ"/>
                      </div>
                      <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-on-primary rounded-full border-2 border-surface-container-lowest shadow-md hover:scale-110 transition-transform">
                        <Edit3 size={16} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="font-label-md text-label-md text-on-surface">Foto Profil</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Unggah gambar baru. Disarankan format JPG atau PNG, minimal 400x400px.</p>
                      <div className="flex gap-2">
                        <button className="text-primary font-label-md text-label-md hover:underline">Unggah Foto</button>
                        <span className="text-outline-variant">•</span>
                        <button className="text-error font-label-md text-label-md hover:underline">Hapus</button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                    <div className="space-y-2">
                      <label className="font-label-md text-label-md text-on-surface block">Nama Lengkap</label>
                      <input 
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-transparent border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" 
                        type="text" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-label-md text-label-md text-on-surface block">Alamat Email</label>
                      <input 
                        name="email"
                        value={profile.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-transparent border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" 
                        type="email" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-label-md text-label-md text-on-surface block">Nomor Telepon</label>
                      <div className="flex">
                        <span className="flex items-center px-4 bg-surface-container-low border border-r-0 border-outline-variant rounded-l-lg text-on-surface-variant font-label-md">+62</span>
                        <input 
                          name="phone"
                          value={profile.phone || ""}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-transparent border border-outline-variant rounded-r-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" 
                          type="tel" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-label-md text-label-md text-on-surface block">Zona Waktu</label>
                      <select 
                        name="timezone"
                        value={profile.timezone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-transparent border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none appearance-none"
                      >
                        <option>WIB (Jakarta) GMT+7</option>
                        <option>WITA (Makassar) GMT+8</option>
                        <option>WIT (Jayapura) GMT+9</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Configuration Section */}
              <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <Bot className="text-primary" size={24} />
                  <h3 className="font-headline-md text-headline-md">Konfigurasi AI (OpenRouter)</h3>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface block">OpenRouter API Key *</label>
                    <input 
                      name="openrouterApiKey"
                      value={profile.openrouterApiKey || ""}
                      onChange={handleChange}
                      placeholder="sk-or-v1-..."
                      className="w-full px-4 py-3 bg-transparent border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" 
                      type="password" 
                      required
                    />
                    <p className="font-body-sm text-body-sm text-on-surface-variant">API Key ini wajib diisi untuk menggunakan bot WhatsApp dan fitur RAG.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface block">Model Chat (Teks) *</label>
                    <input 
                      name="openrouterModel"
                      value={profile.openrouterModel || ""}
                      onChange={handleChange}
                      placeholder="e.g. google/gemini-2.5-flash"
                      className="w-full px-4 py-3 bg-transparent border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" 
                      type="text" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface block">Model Embedding (RAG) *</label>
                    <input 
                      name="openrouterEmbedModel"
                      value={profile.openrouterEmbedModel || ""}
                      onChange={handleChange}
                      placeholder="e.g. nvidia/llama-nemotron-embed-vl-1b-v2:free"
                      className="w-full px-4 py-3 bg-transparent border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" 
                      type="text" 
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <Lock className="text-primary" size={24} />
                  <h3 className="font-headline-md text-headline-md">Keamanan Akun</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer group">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center">
                        <KeyRound className="text-tertiary" size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-label-md text-label-md text-on-surface">Ubah Kata Sandi</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Terakhir diubah 3 bulan yang lalu</p>
                      </div>
                    </div>
                    <ChevronRight className="text-outline group-hover:translate-x-1 transition-transform" size={24} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-surface-container-low transition-colors">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center">
                        <ShieldCheck className="text-primary" size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-label-md text-label-md text-on-surface">Autentikasi Dua Faktor (2FA)</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Amankan akun Anda dengan kode verifikasi</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        name="twoFactor"
                        type="checkbox" 
                        checked={profile.twoFactor} 
                        onChange={handleChange}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences: Sidebar Column */}
            <div className="lg:col-span-4 space-y-gutter">
              <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm h-fit">
                <div className="flex items-center gap-4 mb-8">
                  <SlidersHorizontal className="text-primary" size={24} />
                  <h3 className="font-headline-md text-headline-md">Preferensi</h3>
                </div>
                <div className="space-y-8">
                  
                  {/* Language Selection */}
                  <div className="space-y-3">
                    <label className="font-label-md text-label-md text-on-surface flex items-center gap-2">
                      <Globe size={18} />
                      Bahasa Tampilan
                    </label>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${profile.language === 'id' ? 'border-primary bg-primary-container/10' : 'border-outline-variant hover:bg-surface-container-low'}`}>
                        <input 
                          type="radio" 
                          name="language" 
                          value="id" 
                          checked={profile.language === 'id'}
                          onChange={handleChange}
                          className="text-primary focus:ring-primary" 
                        />
                        <span className="font-body-sm text-body-sm flex-1">Bahasa Indonesia</span>
                        <span className="text-[20px]">🇮🇩</span>
                      </label>
                      <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${profile.language === 'en' ? 'border-primary bg-primary-container/10' : 'border-outline-variant hover:bg-surface-container-low'}`}>
                        <input 
                          type="radio" 
                          name="language" 
                          value="en" 
                          checked={profile.language === 'en'}
                          onChange={handleChange}
                          className="text-primary focus:ring-primary" 
                        />
                        <span className="font-body-sm text-body-sm flex-1">English (US)</span>
                        <span className="text-[20px]">🇺🇸</span>
                      </label>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div className="space-y-4">
                    <p className="font-label-md text-label-md text-on-surface flex items-center gap-2">
                      <Bell size={18} />
                      Notifikasi
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-0.5">
                          <p className="font-body-sm text-body-sm text-on-surface">Notifikasi Email</p>
                          <p className="text-[12px] text-on-surface-variant">Laporan harian AI</p>
                        </div>
                        <input 
                          type="checkbox" 
                          name="emailNotifications"
                          checked={profile.emailNotifications}
                          onChange={handleChange}
                          className="rounded text-primary focus:ring-primary w-5 h-5 cursor-pointer" 
                        />
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-0.5">
                          <p className="font-body-sm text-body-sm text-on-surface">Pesan WhatsApp</p>
                          <p className="text-[12px] text-on-surface-variant">Notifikasi agent aktif</p>
                        </div>
                        <input 
                          type="checkbox" 
                          name="waNotifications"
                          checked={profile.waNotifications}
                          onChange={handleChange}
                          className="rounded text-primary focus:ring-primary w-5 h-5 cursor-pointer" 
                        />
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-0.5">
                          <p className="font-body-sm text-body-sm text-on-surface">Browser Push</p>
                          <p className="text-[12px] text-on-surface-variant">Alert sistem real-time</p>
                        </div>
                        <input 
                          type="checkbox" 
                          name="pushNotifications"
                          checked={profile.pushNotifications}
                          onChange={handleChange}
                          className="rounded text-primary focus:ring-primary w-5 h-5 cursor-pointer" 
                        />
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-surface-container-high text-on-surface-variant rounded-lg font-label-md text-label-md hover:bg-outline-variant/30 transition-colors flex items-center justify-center gap-2">
                    <RotateCcw size={18} />
                    Atur Ulang Default
                  </button>
                </div>
              </div>

              {/* Danger Zone Card */}
              <div className="bg-error-container/10 p-stack-md rounded-xl border border-error/20 h-fit">
                <div className="flex items-center gap-3 mb-4 text-error">
                  <AlertTriangle size={24} />
                  <h4 className="font-label-md text-label-md font-bold">Zona Bahaya</h4>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Menghapus akun Anda akan menghapus semua data agent dan riwayat chat secara permanen.</p>
                <button className="text-error font-label-md text-label-md font-bold hover:underline">Hapus Akun Selamanya</button>
              </div>
            </div>
          </div>

          {/* Footer Stats / Meta */}
          <footer className="grid grid-cols-1 md:grid-cols-3 gap-stack-md pt-stack-lg border-t border-outline-variant">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low">
              <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center">
                <History className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-[12px] text-on-surface-variant uppercase tracking-wider font-bold">Login Terakhir</p>
                <p className="font-label-md text-label-md">2 jam yang lalu via Jakarta, ID</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low">
              <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center">
                <BadgeCheck className="text-secondary" size={24} />
              </div>
              <div>
                <p className="text-[12px] text-on-surface-variant uppercase tracking-wider font-bold">Status Akun</p>
                <p className="font-label-md text-label-md">Terverifikasi (Enterprise)</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low">
              <div className="w-12 h-12 rounded-full bg-tertiary-container/20 flex items-center justify-center">
                <Database className="text-tertiary" size={24} />
              </div>
              <div>
                <p className="text-[12px] text-on-surface-variant uppercase tracking-wider font-bold">Penyimpanan</p>
                <p className="font-label-md text-label-md">1.2 GB dari 10 GB digunakan</p>
              </div>
            </div>
          </footer>
        </div>
    </>
  );
}
