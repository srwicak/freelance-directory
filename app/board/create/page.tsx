'use client';
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createOpportunity, getActivePostCount } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Send, Link as LinkIcon, AlertCircle, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DISCIPLINES, CATEGORY_MAPPING } from '@/lib/constants';

export default function CreateOpportunityPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [userId, setUserId] = useState('');
    const [activeCount, setActiveCount] = useState<number>(0);
    const maxQuota = 3;

    const [formData, setFormData] = useState({
        type: 'JOB',
        title: '',
        description: '',
        field: '',
        expiresAtDays: 14,
        imageUrl: ''
    });

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDisciplines = DISCIPLINES.filter(d => {
        const lowerTerm = searchTerm.toLowerCase();
        if (d.toLowerCase().includes(lowerTerm)) return true;
        const englishKey = Object.keys(CATEGORY_MAPPING).find(key => CATEGORY_MAPPING[key] === d);
        return englishKey && englishKey.toLowerCase().includes(lowerTerm);
    });

    useEffect(() => {
        const storedId = localStorage.getItem('freelancer_access_id');
        if (storedId) {
            setUserId(storedId);
            setVerifying(false);
            fetchCount(storedId);
        } else {
            setVerifying(false); // Let it render the unauthorized state
        }
    }, []);

    const fetchCount = async (uid: string) => {
        const res = await getActivePostCount(uid);
        if (res.success) setActiveCount(res.count);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.title || !formData.description || !formData.type) {
                alert("Mohon lengkapi data wajib (Judul, Deskripsi).");
                setLoading(false);
                return;
            }

            const result = await createOpportunity({
                userId,
                ...formData
            });

            if (result.success) {
                router.refresh();
                router.push(`/board/${result.id}`);
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            console.error("Error creating post: ", error);
            alert("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="flex flex-col items-center py-20 px-4 animate-in fade-in duration-500">
                <Card className="w-full max-w-md shadow-xl border-primary/20 text-center">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                            <AlertCircle className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl">Akses Terbatas</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Hanya member terdaftar yang dapat membuat postingan di Board.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-3 pt-4">
                        <Button asChild className="w-full h-12 text-base">
                            <Link href="/register">Daftar Sekarang</Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full h-12">
                            <Link href="/edit-profile">Saya Sudah Punya Akun (Log In)</Link>
                        </Button>
                        <Button variant="ghost" asChild className="w-full mt-2">
                            <Link href="/board">Kembali ke Board</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center py-8 px-4">
            <div className="w-full max-w-2xl mb-6 relative z-10">
                <Link href="/board" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Board
                </Link>
            </div>

            {/* Overlay to close dropdown */}
            {isDropdownOpen && (
                <div
                    className="fixed inset-0 z-0 bg-transparent"
                    onClick={() => setIsDropdownOpen(false)}
                />
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl relative z-10"
            >
                <Card className="border-0 shadow-2xl shadow-black/5 bg-card/50 backdrop-blur">
                    <CardHeader className="pb-6 border-b border-border/50">
                        <CardTitle className="text-2xl">Buat Postingan Baru</CardTitle>
                        <CardDescription className="text-base">
                            Bagikan peluang proyek atau cari tasker terbaik dari komunitas.
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6 pt-6">

                            <div className="space-y-3">
                                <Label className="text-base">Jenis Postingan <span className="text-red-500">*</span></Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.type === 'JOB' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'}`}
                                        onClick={() => setFormData({ ...formData, type: 'JOB' })}
                                    >
                                        <div className="font-semibold text-lg mb-1">💼 Butuh Freelancer (Loker)</div>
                                        <div className="text-xs text-muted-foreground">Tawarkan proyek, lowongan, atau ajakan kerja sama kepada Freelancer lain.</div>
                                    </div>
                                    <div
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.type === 'TALENT' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'}`}
                                        onClick={() => setFormData({ ...formData, type: 'TALENT' })}
                                    >
                                        <div className="font-semibold text-lg mb-1">📢 Tawarkan Jasa (Promosi)</div>
                                        <div className="text-xs text-muted-foreground">Promosikan layanan, skill, atau jasa Anda agar ditemukan oleh Klien.</div>
                                    </div>
                                </div>
                                <div className="text-xs font-medium text-muted-foreground mt-2 bg-muted/40 p-2 rounded-lg border border-border/50 inline-flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${activeCount >= maxQuota ? 'bg-red-500' : 'bg-green-500'}`} />
                                    Jatah tayang postingan: <span className={activeCount >= maxQuota ? 'text-red-500 font-bold' : ''}>{Math.max(0, maxQuota - activeCount)}/{maxQuota}</span> tersisa.
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label htmlFor="title" className="text-base">Judul Postingan <span className="text-red-500">*</span></Label>
                                <Input
                                    id="title"
                                    placeholder={formData.type === 'JOB' ? "Contoh: Dicari Desainer Grafis untuk Desain Menu Cafe (Budget 1-2 Juta)" : "Contoh: Jasa Ahli Penerjemah Bahasa Inggris-Indonesia Professional"}
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className="h-12 text-lg"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2 relative">
                                    <Label htmlFor="field" className="text-base">Bidang Terkait (Opsional)</Label>
                                    <div className="relative">
                                        <Input
                                            id="field"
                                            placeholder="Cari atau pilih kompetensi utama..."
                                            value={formData.field || searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setFormData({ ...formData, field: "" });
                                                setIsDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            className="h-12"
                                        />
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

                                        {isDropdownOpen && (
                                            <div className="absolute z-10 w-full mt-2 bg-popover border rounded-xl shadow-xl max-h-60 overflow-auto">
                                                {filteredDisciplines.length > 0 ? filteredDisciplines.map((d) => (
                                                    <div
                                                        key={d}
                                                        className="px-4 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm transition-colors first:rounded-t-xl last:rounded-b-xl"
                                                        onClick={() => {
                                                            setFormData({ ...formData, field: d });
                                                            setSearchTerm(d);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                    >
                                                        {d}
                                                    </div>
                                                )) : (
                                                    <div
                                                        className="px-4 py-3 cursor-pointer hover:bg-accent text-sm text-primary rounded-xl"
                                                        onClick={() => {
                                                            setFormData({ ...formData, field: searchTerm });
                                                            setIsDropdownOpen(false);
                                                        }}
                                                    >
                                                        Gunakan &quot;{searchTerm}&quot;
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Agar postingan terekspos ke target yang tepat.</div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expiresAtDays" className="text-base">Durasi Tayang (Hari)</Label>
                                    <Input
                                        id="expiresAtDays"
                                        type="number"
                                        min={1}
                                        max={14}
                                        value={formData.expiresAtDays}
                                        onChange={(e) => setFormData({ ...formData, expiresAtDays: parseInt(e.target.value) || 14 })}
                                        className="h-12"
                                        required
                                    />
                                    <div className="text-xs text-muted-foreground">Maksimal 14 hari. Post otomatis dihapus setelah ini.</div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label htmlFor="description" className="text-base">Deskripsi Detail <span className="text-red-500">*</span></Label>
                                <textarea
                                    id="description"
                                    placeholder={formData.type === 'JOB' ? "Jelaskan ruang lingkup pekerjaan, perkiraan bayaran/budget, syarat, serta format pengajuan yang lengkap." : "Jelaskan layanan/skill spesifik yang Anda tawarkan, portofolio singkat, tarif/harga, atau kontak negosiasi."}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="flex min-h-[200px] w-full rounded-xl border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                    required
                                />
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label htmlFor="imageUrl" className="text-base flex justify-between items-center">
                                    <span>Gambar Pendukung (Opsional)</span>
                                </Label>
                                <div className="text-xs text-muted-foreground mb-2">
                                    Untuk menghemat penyimpanan database, kami hanya menerima tautan (URL) gambar. Anda dapat mengunggah gambar ke layanan seperti <a href="https://postimages.org/" target="_blank" rel="noreferrer" className="text-primary hover:underline">PostImages</a> atau <a href="https://imgbb.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">ImgBB</a> lalu paste <b>Direct Link</b>-nya (berakhiran .jpg/.png) ke kolom ini.
                                </div>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="imageUrl"
                                        placeholder="https://i.postimg.cc/xxx/gambar.jpg"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        className="pl-10 h-12"
                                    />
                                </div>
                                {formData.imageUrl && (
                                    <div className="mt-4 p-2 border border-border/50 rounded-xl bg-muted/20">
                                        <p className="text-xs text-muted-foreground mb-2 text-center text-primary/60">Preview Gambar</p>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            className="w-full max-h-64 object-contain rounded-lg"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgY3Vyc29yPSJhcnJvdyI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTIgOW0tMyAwYTMgMyAwIDEgMCA2IDBhMyAzIDAgMSAwIC02IDBtMyAzaDFtLTQgMGgxIi8+PC9zdmc+'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                        </CardContent>

                        <CardFooter className="pt-6 pb-6 bg-muted/10 border-t border-border/50 flex flex-col gap-2">
                            <Button
                                type="submit"
                                className={`w-full h-14 text-lg font-semibold shadow-lg transition-all ${activeCount >= maxQuota ? 'bg-muted text-muted-foreground shadow-none' : 'bg-primary hover:bg-primary/90 text-white hover:shadow-primary/25'}`}
                                disabled={loading || activeCount >= maxQuota}
                            >
                                {loading && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                                {loading ? 'Memproses...' : activeCount >= maxQuota ? 'Kuota Penuh' : (
                                    <>
                                        <Send className="mr-3 h-5 w-5" />
                                        Posting ke Board
                                    </>
                                )}
                            </Button>
                            {activeCount >= maxQuota && (
                                <p className="text-sm text-red-500 text-center mt-2 px-4 shadow-sm">
                                    Anda telah mencapai batas maksimal ({maxQuota} postingan aktif). Tunggu hingga ada yang kedaluwarsa atau hapus yang lama.
                                </p>
                            )}
                        </CardFooter>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}
