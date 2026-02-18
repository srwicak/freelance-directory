'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Copy, Loader2, MapPin, ChevronDown, ArrowLeft, UserPlus, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { LOCATIONS, DISCIPLINES, CATEGORY_MAPPING } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [successId, setSuccessId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        whatsapp: '',
        field: '',
        province: '',
        city: '',
        details: '',
        portfolio: '',
        linkedin: ''
    });

    // Step-based form for better UX
    const [step, setStep] = useState(1);
    const totalSteps = 3;

    // Searchable dropdown state for Discipline
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Location logic
    const provinces = Object.keys(LOCATIONS).sort();
    const [cities, setCities] = useState<string[]>([]);

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

    const canGoNext = () => {
        if (step === 1) return formData.name.trim() !== '' && formData.whatsapp.trim() !== '';
        if (step === 2) return formData.province !== '' && formData.city !== '' && formData.field !== '';
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.name || !formData.whatsapp || !formData.field || !formData.province || !formData.city) {
                alert("Mohon lengkapi Nama, WhatsApp, Bidang, dan Lokasi.");
                setLoading(false);
                return;
            }

            const result = await registerUser(formData);

            if (result.success && result.userId) {
                setSuccessId(result.userId);
                localStorage.setItem('freelancer_access_id', result.userId);
            } else {
                throw new Error(result.error || 'Unknown error');
            }

        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (successId) {
            navigator.clipboard.writeText(successId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // === SUCCESS STATE ===
    if (successId) {
        return (
            <div className="flex justify-center items-center min-h-[70vh]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    <Card className="border-2 border-emerald-200 dark:border-emerald-800 overflow-hidden">
                        {/* Success header with gradient */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-6 text-center text-white">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            >
                                <PartyPopper className="h-12 w-12 mx-auto mb-3" />
                            </motion.div>
                            <h2 className="text-2xl font-bold">Pendaftaran Berhasil! 🎉</h2>
                            <p className="text-emerald-100 mt-2 text-sm">
                                Profil Anda sudah aktif di direktori
                            </p>
                        </div>

                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-muted-foreground">
                                    User ID Anda (Simpan Baik-baik!)
                                </Label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 p-4 bg-muted rounded-xl text-center">
                                        <code className="text-2xl font-mono font-bold tracking-[0.2em] text-foreground">
                                            {successId}
                                        </code>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant={copied ? "default" : "outline"}
                                        onClick={copyToClipboard}
                                        className={`h-14 w-14 rounded-xl shrink-0 transition-all ${copied ? 'bg-emerald-500 hover:bg-emerald-500 text-white' : ''}`}
                                    >
                                        {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                                <span className="text-lg">⚠️</span>
                                <div>
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                                        Jangan Sampai Hilang!
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                        ID ini satu-satunya cara Anda mengakses direktori. Kami tidak menyimpan email untuk reset.
                                    </p>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-3 p-6 pt-0">
                            <Button asChild className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-primary hover:opacity-90">
                                <Link href="/directory">Lihat Direktori</Link>
                            </Button>
                            <Button asChild variant="ghost" className="w-full h-12 rounded-xl">
                                <Link href="/">Kembali ke Beranda</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        );
    }

    // === FORM STATE ===
    return (
        <div className="flex flex-col items-center py-4 md:py-8">
            {/* Back link */}
            <div className="w-full max-w-lg mb-6">
                <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[40px]">
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    Kembali ke Beranda
                </Link>
            </div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="w-full max-w-lg"
            >
                <Card className="border-0 shadow-xl shadow-black/5">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-primary text-white">
                                <UserPlus className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Daftar Freelancer</CardTitle>
                                <CardDescription>
                                    Langkah {step} dari {totalSteps}
                                </CardDescription>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="flex gap-2 mt-4">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${i < step ? 'bg-gradient-primary' : 'bg-muted'
                                        }`}
                                />
                            ))}
                        </div>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-5 pt-4">
                            <AnimatePresence mode="wait">
                                {/* === STEP 1: Personal Info === */}
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.25 }}
                                        className="space-y-5"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-semibold">
                                                Nama Lengkap <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                placeholder="Contoh: Budi Santoso"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="h-12 rounded-xl text-base"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="wa" className="text-sm font-semibold">
                                                No. WhatsApp <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="wa"
                                                placeholder="Contoh: 62812345678"
                                                type="tel"
                                                value={formData.whatsapp}
                                                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value.replace(/\D/g, '') })}
                                                className="h-12 rounded-xl text-base"
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                💡 Gunakan format internasional tanpa tanda + (62...)
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* === STEP 2: Location & Field === */}
                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.25 }}
                                        className="space-y-5"
                                    >
                                        {/* Location */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <MapPin className="h-4 w-4 text-primary" />
                                                <Label className="text-sm font-semibold">Lokasi <span className="text-red-500">*</span></Label>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="province" className="text-xs text-muted-foreground">Provinsi</Label>
                                                    <select
                                                        id="province"
                                                        className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
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
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="city" className="text-xs text-muted-foreground">Kota/Kabupaten</Label>
                                                    <select
                                                        id="city"
                                                        className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
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
                                        </div>

                                        {/* Field */}
                                        <div className="space-y-2 relative">
                                            <Label htmlFor="field" className="text-sm font-semibold">
                                                Bidang Keahlian <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="field"
                                                    placeholder="Cari atau pilih kategori..."
                                                    value={formData.field || searchTerm}
                                                    onChange={(e) => {
                                                        setSearchTerm(e.target.value);
                                                        setFormData({ ...formData, field: "" });
                                                        setIsDropdownOpen(true);
                                                    }}
                                                    onFocus={() => setIsDropdownOpen(true)}
                                                    className="h-12 rounded-xl text-base pr-10"
                                                    required
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
                                            <p className="text-xs text-muted-foreground">
                                                Pilih kategori yang paling sesuai dengan keahlian Anda.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* === STEP 3: Details & Links === */}
                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.25 }}
                                        className="space-y-5"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="details" className="text-sm font-semibold">
                                                Detail Keahlian / Deskripsi
                                            </Label>
                                            <textarea
                                                id="details"
                                                placeholder="Contoh: Spesialis React Native 5 tahun pengalaman, atau Konsultan Pajak PPH 21..."
                                                value={formData.details}
                                                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                                className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                                rows={3}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Jelaskan lebih detail agar orang lain lebih mudah menemukan Anda.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="portfolio" className="text-sm font-semibold">
                                                Link Portfolio <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
                                            </Label>
                                            <Input
                                                id="portfolio"
                                                placeholder="https://..."
                                                type="url"
                                                value={formData.portfolio}
                                                onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                                                className="h-12 rounded-xl text-base"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="linkedin" className="text-sm font-semibold">
                                                Link LinkedIn <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
                                            </Label>
                                            <Input
                                                id="linkedin"
                                                placeholder="https://linkedin.com/in/..."
                                                type="url"
                                                value={formData.linkedin}
                                                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                                className="h-12 rounded-xl text-base"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>

                        <CardFooter className="flex gap-3 pt-2">
                            {step > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-12 rounded-xl text-base"
                                    onClick={() => setStep(step - 1)}
                                >
                                    Kembali
                                </Button>
                            )}

                            {step < totalSteps ? (
                                <Button
                                    type="button"
                                    className="flex-1 h-12 rounded-xl text-base font-semibold bg-gradient-primary hover:opacity-90"
                                    disabled={!canGoNext()}
                                    onClick={() => setStep(step + 1)}
                                >
                                    Lanjut
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    className="flex-1 h-12 rounded-xl text-base font-semibold bg-gradient-primary hover:opacity-90"
                                    disabled={loading}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {loading ? 'Menyimpan...' : 'Daftar Sekarang'}
                                </Button>
                            )}
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
