"use client";

import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, RefreshCcw, CheckCircle2, ShieldAlert, Bot, Wifi, WifiOff } from "lucide-react";

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'authenticating' | 'ready' | 'backend_offline';

interface DeviceInfo {
  id: string;
  name: string;
  phoneNumber: string | null;
  jid: string | null;
  status: string;
  connectedAt: string | null;
  lastSeenAt: string | null;
}

export default function AgentsPage() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch status from server-side API (reliable, no browser WebSocket issues)
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      
      setStatus(data.status);
      setQrCode(data.qr);

      // If connected/ready, save device to database
      if (data.status === 'connected' || data.status === 'ready') {
        setQrCode(null);
        if (data.user) {
          await saveDevice(data.status, data.user);
        }
      } else if (data.status === 'disconnected') {
        // Automatically clean up database if disconnected
        try {
          // Only call DELETE if we know we had devices (optimistic check) to prevent spamming
          setDevices(prevDevices => {
            if (prevDevices.length > 0) {
              fetch("/api/devices", { method: "DELETE" })
                .then(() => fetchDevices())
                .catch(console.error);
            }
            return []; // clear UI optimistically
          });
        } catch (e) {}
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
      setStatus('backend_offline');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save device to database
  const saveDevice = async (deviceStatus: string, user: any) => {
    try {
      // user.id format is usually '628xxx:12@s.whatsapp.net'
      const jid = user?.id || "default-device";
      const name = user?.name || "WhatsApp Device";
      const phoneNumber = jid !== "default-device" ? jid.split('@')[0].split(':')[0] : null;

      await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jid,
          name,
          phoneNumber,
          status: deviceStatus,
        }),
      });
      // Refresh device list
      fetchDevices();
    } catch (error) {
      console.error("Failed to save device:", error);
    }
  };

  // Fetch devices from database
  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDevices(data);
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    }
  };

  // Poll status every 5 seconds
  useEffect(() => {
    fetchStatus();
    fetchDevices();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const getStatusColor = () => {
    switch (status) {
      case 'ready':
      case 'connected': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'connecting':
      case 'authenticating': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'backend_offline': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-red-500 bg-red-500/10 border-red-500/20';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'ready': return 'Perangkat Siap Digunakan';
      case 'connected': return 'Perangkat Terhubung';
      case 'connecting': return 'Menghubungkan...';
      case 'authenticating': return 'Mengautentikasi...';
      case 'backend_offline': return 'Server Backend Offline';
      default: return 'Perangkat Terputus';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'ready':
      case 'connected': return <CheckCircle2 size={18} />;
      case 'connecting':
      case 'authenticating': return <RefreshCcw size={18} className="animate-spin" />;
      case 'backend_offline': return <WifiOff size={18} />;
      default: return <ShieldAlert size={18} />;
    }
  };

  return (
    <div className="w-full space-y-stack-lg max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-outline-variant/30">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-2">
            <Bot className="text-primary" size={32} />
            Hubungkan Perangkat
          </h2>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Scan kode QR di bawah menggunakan aplikasi WhatsApp di HP Anda untuk menghubungkan nomor.
          </p>
        </div>
        
        {/* Status Badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="font-label-md text-label-md font-bold">{getStatusText()}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
        {/* Left Side: QR Code Area */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 text-secondary text-center">
              <RefreshCcw size={48} className="animate-spin opacity-50" />
              <p className="font-body-md text-body-md">Memuat status...</p>
            </div>
          ) : status === 'backend_offline' ? (
            <div className="flex flex-col items-center gap-4 text-red-500 text-center">
              <WifiOff size={48} />
              <h3 className="font-headline-sm text-headline-sm">Server Backend Offline</h3>
              <p className="font-body-sm text-body-sm text-secondary max-w-[280px]">
                Pastikan backend server berjalan di port 8080. Jalankan <code className="bg-surface-container px-2 py-1 rounded text-xs">npm run dev</code> di folder utama proyek.
              </p>
            </div>
          ) : status === 'ready' || status === 'connected' ? (
            <div className="flex flex-col items-center gap-4 text-green-600 text-center">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="font-headline-md text-headline-md font-bold">WhatsApp Terhubung</h3>
              <p className="font-body-md text-body-md text-secondary">
                Nomor Anda sudah berhasil terhubung ke AI Agent dan siap melayani pesan.
              </p>
            </div>
          ) : qrCode ? (
            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
              <div className="p-4 bg-white rounded-xl shadow-md border border-outline-variant/20">
                <QRCodeSVG value={qrCode} size={256} level="H" includeMargin={true} />
              </div>
              <p className="font-label-md text-label-md text-secondary text-center">
                QR Code akan berubah secara otomatis.<br/>Jangan refresh halaman ini.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-secondary text-center">
              <RefreshCcw size={48} className="animate-spin opacity-50" />
              <h3 className="font-headline-sm text-headline-sm">Menunggu QR Code...</h3>
              <p className="font-body-sm text-body-sm max-w-[250px]">
                Jika QR Code tidak muncul, pastikan nomor WhatsApp belum login atau restart backend server.
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Instructions or Connected Device Info */}
        <div className="space-y-stack-lg">
          {/* Instructions Card */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 shadow-sm h-fit">
            <div className="flex items-center gap-3 mb-6 text-primary">
              <Smartphone size={28} />
              <h3 className="font-headline-md text-headline-md font-bold">Cara Menghubungkan</h3>
            </div>
            
            <ol className="space-y-6 relative border-l-2 border-primary/20 ml-3 pl-6">
              <li className="relative">
                <span className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-md">1</span>
                <h4 className="font-label-lg text-label-lg font-bold text-on-surface mb-1">Buka Aplikasi WhatsApp</h4>
                <p className="font-body-sm text-body-sm text-secondary">Buka WhatsApp di handphone yang akan dijadikan sebagai nomor pengirim AI Agent.</p>
              </li>
              <li className="relative">
                <span className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-md">2</span>
                <h4 className="font-label-lg text-label-lg font-bold text-on-surface mb-1">Pilih Perangkat Taut (Linked Devices)</h4>
                <p className="font-body-sm text-body-sm text-secondary">Ketuk ikon titik tiga di sudut kanan atas layar (atau Pengaturan di iPhone) dan pilih <strong>Perangkat Taut</strong>.</p>
              </li>
              <li className="relative">
                <span className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-md">3</span>
                <h4 className="font-label-lg text-label-lg font-bold text-on-surface mb-1">Tautkan Perangkat</h4>
                <p className="font-body-sm text-body-sm text-secondary">Ketuk tombol <strong>Tautkan Perangkat</strong>. Anda mungkin diminta untuk menggunakan sidik jari, pengenalan wajah, atau PIN.</p>
              </li>
              <li className="relative">
                <span className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-md">4</span>
                <h4 className="font-label-lg text-label-lg font-bold text-on-surface mb-1">Scan Kode QR</h4>
                <p className="font-body-sm text-body-sm text-secondary">Arahkan kamera HP Anda ke layar komputer ini untuk memindai kode QR yang muncul di sebelah kiri.</p>
              </li>
            </ol>
          </div>

          {/* Connected Devices List */}
          {devices.length > 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4 text-on-surface">
                <Wifi size={22} className="text-primary" />
                <h3 className="font-label-lg text-label-lg font-bold">Perangkat Tersimpan</h3>
              </div>
              <div className="space-y-3">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/20">
                    <div className={`w-3 h-3 rounded-full ${device.status === 'connected' || device.status === 'ready' ? 'bg-green-500' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-label-md text-label-md text-on-surface truncate">{device.name}</p>
                      <p className="font-body-sm text-body-sm text-secondary">
                        {device.connectedAt ? `Terhubung: ${new Date(device.connectedAt).toLocaleString('id-ID')}` : 'Belum terhubung'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      device.status === 'connected' || device.status === 'ready' 
                        ? 'bg-green-500/10 text-green-600' 
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {device.status === 'connected' || device.status === 'ready' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
