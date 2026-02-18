'use client';

import { useState, useEffect } from 'react';
import { getFreelancers } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Lock, Unlock, ExternalLink, MessageCircle, MapPin, Users, X, ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';
import { CATEGORY_MAPPING } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Freelancer {
    id: string;
    name: string;
    field: string;
    province?: string;
    city?: string;
    details: string;
    portfolio?: string;
    linkedin: string;
    createdAt?: any;
}

const fadeInUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 }
};

export default function DirectoryPage() {
    const [users, setUsers] = useState<Freelancer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedField, setSelectedField] = useState('All');

    // Access Control
    const [viewerId, setViewerId] = useState<string | null>(null);
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
    const [tempId, setTempId] = useState('');
    const [accessError, setAccessError] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const getLocalizedField = (field: string) => {
        return CATEGORY_MAPPING[field] || field;
    };

    // Generate initials avatar color based on name
    const getAvatarColor = (name: string) => {
        const colors = [
            'from-cyan-500 to-blue-500',
            'from-blue-500 to-indigo-500',
            'from-violet-500 to-fuchsia-500',
            'from-amber-400 to-orange-500',
            'from-indigo-400 to-cyan-500',
            'from-rose-400 to-red-500',
            'from-fuchsia-500 to-purple-600',
            'from-sky-400 to-blue-600',
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const result = await getFreelancers();
                if (result.success && result.data) {
                    setUsers(result.data as Freelancer[]);
                } else if (!result.success) {
                    setFetchError(result.error || 'Terjadi kesalahan yang tidak diketahui');
                }
            } catch (error) {
                console.error("Error fetching users:", error);
                // Show the actual error message to help debug "Gagal terhubung"
                setFetchError(error instanceof Error ? error.message : String(error));
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();

        const savedId = localStorage.getItem('freelancer_access_id');
        if (savedId) {
            setViewerId(savedId);
        }
    }, []);

    const handleVerifyId = () => {
        setVerifying(true);
        // Small delay for UX
        setTimeout(() => {
            const isValid = users.some(u => u.id === tempId);
            if (isValid) {
                setViewerId(tempId);
                localStorage.setItem('freelancer_access_id', tempId);
                setIsAccessModalOpen(false);
                setAccessError('');
            } else {
                setAccessError('ID tidak ditemukan. Pastikan Anda sudah terdaftar.');
            }
            setVerifying(false);
        }, 500);
    };

    const handleLogout = () => {
        setViewerId(null);
        localStorage.removeItem('freelancer_access_id');
    };

    const filteredUsers = users.filter(user => {
        const localizedField = getLocalizedField(user.field);
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            localizedField.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.details && user.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.city && user.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.province && user.province.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesField = selectedField === 'All' || localizedField === selectedField;
        return matchesSearch && matchesField;
    });

    const uniqueFields = Array.from(new Set(users.map(u => getLocalizedField(u.field)))).sort();

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Header */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors md:hidden min-h-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Direktori Freelancer</h1>
                    </div>
                    <p className="text-muted-foreground text-sm md:text-base">
                        Temukan talent terbaik di komunitas kami
                        {!loading && <span className="ml-1">— <span className="font-semibold text-foreground">{users.length}</span> anggota</span>}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {viewerId ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-xl"
                        >
                            <div className="flex items-center gap-2 text-primary">
                                <ShieldCheck className="h-4 w-4" />
                                <span className="text-sm font-semibold">Akses Aktif</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1 min-h-0"
                            >
                                <LogOut className="h-3 w-3" />
                                Keluar
                            </button>
                        </motion.div>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() => setIsAccessModalOpen(true)}
                            className="h-11 rounded-xl px-5 font-semibold"
                        >
                            <Lock className="mr-2 h-4 w-4" />
                            Masuk dengan ID
                        </Button>
                    )}
                </div>
            </motion.div>

            {/* Search & Filter */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row gap-3"
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari nama, bidang, atau lokasi..."
                        className="pl-10 h-12 rounded-xl text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-0"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <select
                    className="h-12 rounded-xl border border-input bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-w-[180px] transition-colors"
                    value={selectedField}
                    onChange={(e) => setSelectedField(e.target.value)}
                >
                    <option value="All">Semua Bidang</option>
                    {uniqueFields.map(field => (
                        <option key={field} value={field}>{field}</option>
                    ))}
                </select>
            </motion.div>

            {/* Results count */}
            {!loading && searchTerm && (
                <p className="text-sm text-muted-foreground">
                    Menampilkan <span className="font-semibold text-foreground">{filteredUsers.length}</span> hasil
                    {searchTerm && <> untuk &quot;<span className="font-medium">{searchTerm}</span>&quot;</>}
                </p>
            )}

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="rounded-2xl border bg-card p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-full shimmer" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-3/4 rounded shimmer" />
                                    <div className="h-3 w-1/2 rounded shimmer" />
                                </div>
                            </div>
                            <div className="h-3 w-full rounded shimmer" />
                            <div className="h-3 w-2/3 rounded shimmer" />
                            <div className="h-10 w-full rounded-xl shimmer" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredUsers.map((user, i) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.05, 0.4) }}
                        >
                            <Card className="relative overflow-hidden card-hover border-border bg-card rounded-2xl shadow-md shadow-black/5">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className={`flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(user.name)} text-white text-sm font-bold shrink-0 shadow-sm`}>
                                            {getInitials(user.name)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <CardTitle className="text-lg truncate">{user.name}</CardTitle>
                                            {(user.city || user.province) && (
                                                <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                                                    <MapPin className="h-3 w-3 mr-1 shrink-0" />
                                                    <span className="truncate">
                                                        {user.city ? `${user.city}, ` : ''}{user.province}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold badge-primary">
                                            {getLocalizedField(user.field)}
                                        </span>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-3 pb-5">
                                    {viewerId ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-3"
                                        >
                                            {user.details && (
                                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                                    {user.details}
                                                </p>
                                            )}

                                            <div className="flex flex-col gap-2 pt-1">
                                                <a
                                                    href={user.linkedin}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white bg-[#0077b5] hover:bg-[#006097] transition-colors"
                                                >
                                                    <span className="font-bold text-lg leading-none">in</span>
                                                    Connect on LinkedIn
                                                </a>

                                                {user.portfolio && (
                                                    <Button asChild size="sm" variant="outline" className="h-10 rounded-xl text-xs w-full">
                                                        <a href={user.portfolio} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Lihat Portfolio
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="relative">
                                            <div className="filter blur-sm select-none opacity-40 space-y-2 pointer-events-none" aria-hidden="true">
                                                <p className="text-sm">Detail keahlian dan informasi kontak freelancer ini tersembunyi.</p>
                                                <div className="h-10 bg-muted rounded-xl w-full"></div>
                                                <div className="flex gap-2">
                                                    <div className="h-9 bg-muted rounded-lg flex-1"></div>
                                                    <div className="h-9 bg-muted rounded-lg flex-1"></div>
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                                <div className="p-2.5 rounded-full bg-muted mb-2">
                                                    <Lock className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <p className="text-xs text-muted-foreground font-medium mb-3">
                                                    Masuk untuk lihat detail
                                                </p>
                                                <Button
                                                    size="sm"
                                                    onClick={() => setIsAccessModalOpen(true)}
                                                    className="h-9 rounded-lg text-xs font-semibold bg-gradient-primary hover:opacity-90"
                                                >
                                                    Masukkan ID
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}

                    {filteredUsers.length === 0 && (
                        <div className="col-span-full text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                                <Search className="h-7 w-7 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-lg mb-1">
                                {fetchError ? 'Gagal Memuat Data' : 'Tidak Ditemukan'}
                            </h3>
                            <p className="text-muted-foreground text-sm max-w-md mx-auto">
                                {fetchError ? (
                                    <span className="text-red-500 font-mono text-xs block mt-2 bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-900 break-all">
                                        Error: {fetchError}
                                    </span>
                                ) : (
                                    "Coba ubah kata kunci pencarian atau filter bidang."
                                )}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Access Modal */}
            <AnimatePresence>
                {isAccessModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setIsAccessModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm p-7 space-y-5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setIsAccessModalOpen(false)}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground min-h-0"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary text-white mb-2">
                                    <Lock className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold">Masukkan User ID</h3>
                                <p className="text-sm text-muted-foreground">
                                    Masukkan ID yang Anda dapat saat mendaftar untuk melihat detail kontak.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Input
                                    placeholder="Tempel User ID disini..."
                                    value={tempId}
                                    onChange={(e) => {
                                        setTempId(e.target.value);
                                        setAccessError('');
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyId()}
                                    className="text-center font-mono text-lg h-14 rounded-xl"
                                    autoFocus
                                />
                                <AnimatePresence>
                                    {accessError && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="text-xs text-red-500 text-center"
                                        >
                                            {accessError}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex flex-col gap-2.5">
                                <Button
                                    onClick={handleVerifyId}
                                    disabled={!tempId || verifying}
                                    className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-primary hover:opacity-90"
                                >
                                    {verifying ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Memverifikasi...
                                        </>
                                    ) : (
                                        <>
                                            <Unlock className="mr-2 h-4 w-4" />
                                            Buka Akses
                                        </>
                                    )}
                                </Button>

                                <div className="relative py-3">
                                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-3 text-muted-foreground font-medium">Belum punya ID?</span>
                                    </div>
                                </div>

                                <Button variant="outline" asChild className="w-full h-11 rounded-xl font-semibold">
                                    <Link href="/register">
                                        <Users className="mr-2 h-4 w-4" />
                                        Daftar Sekarang
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
