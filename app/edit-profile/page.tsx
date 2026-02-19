'use client';
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserById, updateUser } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, ChevronDown, ArrowLeft, UserCog, Save, LogIn } from 'lucide-react';
import Link from 'next/link';
import { LOCATIONS, DISCIPLINES, CATEGORY_MAPPING } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function EditProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true); // Initial check
    const [userId, setUserId] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        field: '',
        province: '',
        city: '',
        details: '',
        portfolio: '',
        linkedin: ''
    });

    // Searchable dropdown state for Discipline
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Location logic
    const provinces = Object.keys(LOCATIONS).sort();
    const [cities, setCities] = useState<string[]>([]);

    useEffect(() => {
        const storedId = localStorage.getItem('freelancer_access_id');
        if (storedId) {
            setUserId(storedId);
            fetchUserData(storedId);
        } else {
            setVerifying(false);
        }
    }, []);

    const fetchUserData = async (id: string) => {
        setVerifying(true);
        try {
            const result = await getUserById(id);
            if (result.success && result.data) {
                const user = result.data;
                setFormData({
                    name: user.name || '',
                    field: user.field || '',
                    province: user.province || '',
                    city: user.city || '',
                    details: user.details || '',
                    portfolio: user.portfolio || '',
                    linkedin: user.linkedin || ''
                });

                // Set initial cities based on province
                if (user.province && LOCATIONS[user.province]) {
                    setCities(LOCATIONS[user.province].sort());
                }

                // Set search term for field
                setSearchTerm(user.field || '');

                setIsAuthenticated(true);
                // Save to local storage if manual entry
                localStorage.setItem('freelancer_access_id', id);
            } else {
                // If ID invalid, maybe clear storage?
                // localStorage.removeItem('freelancer_access_id');
                // Don't auto-clear, maybe user just has bad net, let them try manually? 
                // But result.success false likely means not found.
                if (result.error === 'User tidak ditemukan.') {
                    // alert('ID User tidak ditemukan.');
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setVerifying(false);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId.trim()) return;
        fetchUserData(userId);
    };

    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const province = e.target.value;
        setFormData({ ...formData, province, city: '' });
        if (province && LOCATIONS[province]) {
            setCities(LOCATIONS[province].sort());
        } else {
            setCities([]);
        }
    };

    const filteredDisciplines = DISCIPLINES.filter(d => {
        const lowerTerm = searchTerm.toLowerCase();
        if (d.toLowerCase().includes(lowerTerm)) return true;
        const englishKey = Object.keys(CATEGORY_MAPPING).find(key => CATEGORY_MAPPING[key] === d);
        return englishKey && englishKey.toLowerCase().includes(lowerTerm);
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.name || !formData.linkedin || !formData.field || !formData.province || !formData.city) {
                alert("Mohon lengkapi data wajib (Nama, LinkedIn, Bidang, Lokasi).");
                setLoading(false);
                return;
            }

            const result = await updateUser(userId, formData);

            if (result.success) {
                alert("Profil berhasil diperbarui!");
                router.refresh();
                router.push('/directory'); // Or just stay here? directory seems better to see result
            } else {
                throw new Error(result.error || 'Unknown error');
            }

        } catch (error) {
            console.error("Error updating profile: ", error);
            alert("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('freelancer_access_id');
        setUserId('');
        setIsAuthenticated(false);
        setFormData({
            name: '',
            field: '',
            province: '',
            city: '',
            details: '',
            portfolio: '',
            linkedin: ''
        });
    };

    if (verifying) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Memuat data profil...</span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center py-12 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <Card className="shadow-lg border-primary/20">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                <UserCog className="h-6 w-6" />
                            </div>
                            <CardTitle>Edit Profil</CardTitle>
                            <CardDescription>
                                Masukkan User ID Anda untuk mengedit profil. ID ini diberikan saat Anda mendaftar.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleLogin}>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="userId">User ID</Label>
                                    <Input
                                        id="userId"
                                        placeholder="Contoh: V1StGXP..."
                                        value={userId}
                                        onChange={(e) => setUserId(e.target.value)}
                                        className="h-12 text-center text-lg font-mono tracking-wider"
                                        required
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-3">
                                <Button type="submit" className="w-full h-12 text-base" disabled={!userId}>
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Masuk ke Editor
                                </Button>
                                <Button variant="ghost" asChild className="w-full">
                                    <Link href="/">Kembali ke Beranda</Link>
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center py-4 md:py-8">
            <div className="w-full max-w-2xl mb-6 flex justify-between items-center px-4 md:px-0">
                <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    Kembali
                </Link>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                        ID: {userId}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs h-7">
                        Ganti Akun
                    </Button>
                </div>
            </div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="w-full max-w-2xl"
            >
                <Card className="border-0 shadow-xl shadow-black/5">
                    <CardHeader className="pb-3 border-b mb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white">
                                <UserCog className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Edit Profil Freelancer</CardTitle>
                                <CardDescription>
                                    Perbarui informasi profil pencarian kerja Anda
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">

                            {/* Personal Info Section */}
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2 text-primary">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">1</span>
                                    Data Pribadi
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nama Lengkap <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="linkedin">Link LinkedIn <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="linkedin"
                                            value={formData.linkedin}
                                            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                            placeholder="https://linkedin.com/in/..."
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-border" />

                            {/* Location Section */}
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2 text-primary">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">2</span>
                                    Lokasi & Bidang
                                </h3>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="province">Provinsi <span className="text-red-500">*</span></Label>
                                        <select
                                            id="province"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                            value={formData.province}
                                            onChange={handleProvinceChange}
                                            required
                                        >
                                            <option value="">Pilih Provinsi</option>
                                            {provinces.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Kota/Kabupaten <span className="text-red-500">*</span></Label>
                                        <select
                                            id="city"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            required
                                            disabled={!formData.province}
                                        >
                                            <option value="">Pilih Kota</option>
                                            {cities.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2 relative">
                                    <Label htmlFor="field">Bidang Keahlian <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <Input
                                            id="field"
                                            placeholder="Cari atau pilih..."
                                            value={formData.field || searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setFormData({ ...formData, field: "" });
                                                setIsDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            required
                                        />
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

                                        {isDropdownOpen && (
                                            <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                                                {filteredDisciplines.length > 0 ? filteredDisciplines.map((d) => (
                                                    <div
                                                        key={d}
                                                        className="px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm"
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
                                                        className="px-4 py-2 cursor-pointer hover:bg-accent text-sm text-primary"
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
                                </div>
                            </div>

                            <div className="h-px bg-border" />

                            {/* Details Section */}
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2 text-primary">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">3</span>
                                    Detail & Portofolio
                                </h3>

                                <div className="space-y-2">
                                    <Label htmlFor="details">Detail Keahlian</Label>
                                    <textarea
                                        id="details"
                                        placeholder="Deskripsikan pengalaman dan spesialisasi Anda..."
                                        value={formData.details}
                                        onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        rows={3}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="portfolio">Link Portfolio</Label>
                                        <Input
                                            id="portfolio"
                                            placeholder="https://..."
                                            value={formData.portfolio}
                                            onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                                        />
                                    </div>

                                </div>
                            </div>

                        </CardContent>

                        <CardFooter className="pt-2">
                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-semibold bg-primary hover:opacity-90"
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Menyimpan...' : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Simpan Perubahan
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </motion.div>

            {/* Overlay to close dropdown */}
            {isDropdownOpen && (
                <div
                    className="fixed inset-0 z-0 bg-transparent"
                    onClick={() => setIsDropdownOpen(false)}
                />
            )}
        </div>
    );
}
