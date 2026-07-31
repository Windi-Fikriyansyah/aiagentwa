"use client";

import { 
  Database, 
  History, 
  FileUp, 
  CloudUpload, 
  Globe, 
  Filter, 
  RefreshCw, 
  FileText, 
  Trash2,
  Loader2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

type KnowledgeSource = {
  id: string;
  name: string;
  type: string;
  status: string;
  url?: string;
  filePath?: string;
  sizeBytes?: number;
  createdAt: string;
};

export default function KnowledgeBasePage() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [urlInput, setUrlInput] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDevices(data);
        if (data.length > 0) {
          setSelectedDeviceId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    }
  };

  const fetchSources = async (deviceId: string) => {
    if (!deviceId) return;
    try {
      const res = await fetch(`/api/knowledge?deviceId=${deviceId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSources(data);
      }
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      fetchSources(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  const handleUrlCrawl = async () => {
    if (!urlInput.trim()) return;
    setIsCrawling(true);
    try {
      const formData = new FormData();
      formData.append("type", "URL");
      formData.append("url", urlInput.trim());
      if (selectedDeviceId) formData.append("deviceId", selectedDeviceId);

      const res = await fetch("/api/knowledge", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUrlInput("");
        await fetchSources(selectedDeviceId);
      } else {
        const errData = await res.json().catch(() => null);
        alert(`Gagal menambahkan URL: ${errData?.error || res.statusText}`);
      }
    } catch (error) {
      console.error("Failed to crawl URL:", error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsCrawling(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      alert("Ukuran file maksimal adalah 20MB.");
      return;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("type", "FILE");
      formData.append("file", file);
      if (selectedDeviceId) formData.append("deviceId", selectedDeviceId);

      const res = await fetch("/api/knowledge", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await fetchSources(selectedDeviceId);
      } else {
        alert("Gagal mengunggah file.");
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-primary/5', 'border-primary');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus sumber ini?")) return;
    
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/knowledge/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchSources(selectedDeviceId);
      } else {
        alert("Gagal menghapus data.");
      }
    } catch (error) {
      console.error("Failed to delete source:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Helper formatting
  const formatBytes = (bytes: number = 0) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const totalSize = sources.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);

  return (
    <div className="p-gutter max-w-container-max mx-auto animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="mb-stack-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Knowledge Base</h1>
          <p className="text-body-md font-body-md text-on-surface-variant max-w-2xl mb-4">
            Kelola sumber informasi yang digunakan AI untuk menjawab pertanyaan pelanggan secara otomatis dan akurat.
          </p>
          {devices.length > 0 && (
            <div className="flex items-center gap-3 bg-surface-container-low p-2 rounded-lg inline-flex border border-outline-variant">
              <span className="text-body-sm text-on-surface-variant font-medium ml-2">Akun Bot:</span>
              <select 
                className="bg-surface text-on-surface text-body-sm border border-outline rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name} {d.phoneNumber ? `(${d.phoneNumber})` : ''}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center gap-4 min-w-[200px] hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center">
              <Database size={20} />
            </div>
            <div>
              <p className="text-label-sm font-label-sm text-secondary">Total Knowledge</p>
              <p className="font-headline-md text-headline-md text-on-surface leading-none mt-1">
                {formatBytes(totalSize)}
              </p>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center gap-4 min-w-[200px] hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center">
              <History size={20} />
            </div>
            <div>
              <p className="text-label-sm font-label-sm text-secondary">Total Sumber</p>
              <p className="font-headline-md text-headline-md text-on-surface leading-none mt-1">{sources.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Source Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter mb-stack-lg">
        {/* Upload Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-gutter rounded-xl hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-stack-md">
            <FileUp className="text-primary" size={24} />
            <h3 className="font-headline-md text-headline-md">Unggah Dokumen</h3>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.doc,.docx,.txt"
          />

          <div 
            className={`border-2 border-dashed border-outline-variant rounded-xl p-stack-lg flex flex-col items-center justify-center bg-surface-container-lowest hover:bg-primary/5 hover:border-primary transition-colors cursor-pointer group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-primary/5', 'border-primary'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('bg-primary/5', 'border-primary'); }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="animate-spin text-primary mb-3" size={40} />
            ) : (
              <CloudUpload className="text-outline mb-3 group-hover:text-primary transition-colors" size={40} />
            )}
            
            <p className="font-label-md text-label-md text-on-surface mb-1">
              {isUploading ? "Mengunggah..." : "Tarik dan lepas file di sini"}
            </p>
            <p className="text-body-sm font-body-sm text-on-surface-variant text-center">PDF, DOCX, atau TXT (Maks. 20MB per file)</p>
            <button className="mt-4 px-6 py-2 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container transition-all" disabled={isUploading}>
              Pilih File
            </button>
          </div>
        </div>

        {/* URL Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-gutter rounded-xl flex flex-col hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-stack-md">
            <Globe className="text-primary" size={24} />
            <h3 className="font-headline-md text-headline-md">Tautkan Website</h3>
          </div>
          <p className="text-body-sm font-body-sm text-on-surface-variant mb-6">
            Masukkan URL website untuk merayapi (crawl) informasi secara otomatis. Kami akan mengambil konten teks saja.
          </p>
          <div className="space-y-4 mt-auto">
            <div>
              <label className="font-label-md text-label-md text-on-surface block mb-2">URL Website</label>
              <div className="flex gap-2">
                <input 
                  className="flex-1 px-4 py-2 bg-surface border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                  placeholder="https://help.company.com" 
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlCrawl()}
                  disabled={isCrawling}
                />
                <button 
                  onClick={handleUrlCrawl}
                  disabled={isCrawling || !urlInput.trim()}
                  className="px-6 py-2 bg-primary-container text-on-primary-container font-bold rounded-lg active:scale-[0.98] transition-transform hover:opacity-90 disabled:opacity-50 flex items-center justify-center min-w-[90px]"
                >
                  {isCrawling ? <Loader2 size={20} className="animate-spin" /> : "Crawl"}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer" id="subpages" type="checkbox" defaultChecked />
              <label className="text-body-sm font-body-sm text-on-surface-variant cursor-pointer" htmlFor="subpages">
                Ikut sertakan sub-halaman (Kedalaman: 1 level)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
        <div className="px-gutter py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <h3 className="font-headline-md text-headline-md">Data Sources</h3>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors border border-outline-variant text-on-surface-variant">
              <Filter size={20} />
            </button>
            <button onClick={() => selectedDeviceId && fetchSources(selectedDeviceId)} className="p-2 hover:bg-surface-container-low rounded-lg transition-colors border border-outline-variant text-on-surface-variant">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-gutter py-3 font-label-md text-label-md text-secondary">Nama Sumber</th>
                <th className="px-gutter py-3 font-label-md text-label-md text-secondary">Tipe</th>
                <th className="px-gutter py-3 font-label-md text-label-md text-secondary">Status</th>
                <th className="px-gutter py-3 font-label-md text-label-md text-secondary">Tanggal Ditambahkan</th>
                <th className="px-gutter py-3 font-label-md text-label-md text-secondary text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-gutter py-8 text-center text-secondary">
                    Belum ada sumber data. Tambahkan file atau URL di atas.
                  </td>
                </tr>
              ) : (
                sources.map((source) => (
                  <tr key={source.id} className="hover:bg-surface transition-colors">
                    <td className="px-gutter py-4">
                      <div className="flex items-center gap-3">
                        {source.type === 'URL' ? (
                          <Globe className="text-secondary" size={20} />
                        ) : (
                          <FileText className="text-secondary" size={20} />
                        )}
                        <span className="font-label-md text-label-md text-on-surface truncate max-w-[250px] inline-block" title={source.name}>
                          {source.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-gutter py-4">
                      <span className="px-2 py-1 bg-surface-container-high text-on-secondary-container text-label-sm font-label-sm rounded-md uppercase">
                        {source.type}
                      </span>
                    </td>
                    <td className="px-gutter py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${source.status === 'Synced' ? 'bg-[#25D366]' : source.status === 'Error' ? 'bg-error' : 'bg-[#25D366] animate-pulse'}`}></div>
                        <span className="text-body-sm font-body-sm text-on-surface">{source.status}</span>
                      </div>
                    </td>
                    <td className="px-gutter py-4 text-body-sm font-body-sm text-on-surface-variant">
                      {new Date(source.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-gutter py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 hover:bg-surface-container-high rounded transition-colors text-on-surface-variant" title="Sync ulang">
                          <RefreshCw size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(source.id)}
                          disabled={isDeleting === source.id}
                          className="p-1.5 hover:bg-error-container hover:text-error rounded transition-colors text-on-surface-variant disabled:opacity-50" 
                          title="Hapus"
                        >
                          {isDeleting === source.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-gutter py-3 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-between">
          <span className="text-body-sm font-body-sm text-on-surface-variant">Menampilkan {sources.length} sumber data</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-outline-variant rounded hover:bg-surface transition-colors text-body-sm text-on-surface">Sebelumnya</button>
            <button className="px-3 py-1 border border-outline-variant rounded hover:bg-surface transition-colors text-body-sm text-on-surface">Selanjutnya</button>
          </div>
        </div>
      </div>
    </div>
  );
}
