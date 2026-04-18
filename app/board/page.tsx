'use client';

import { useState, useEffect } from 'react';
import { getOpportunities } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Briefcase, Users, MapPin, Calendar, ThumbsUp, ThumbsDown } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function BoardPage() {
    const [activeTab, setActiveTab] = useState<'JOB' | 'TALENT'>('JOB');
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [fieldFilter, setFieldFilter] = useState('');

    useEffect(() => {
        fetchPosts(activeTab, fieldFilter);
    }, [activeTab]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPosts(activeTab, fieldFilter);
    };

    const fetchPosts = async (type: string, field: string = '') => {
        setLoading(true);
        try {
            const res = await getOpportunities(type, 1, 20, field);
            if (res.success) {
                setPosts(res.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Freelancer Board</h1>
                    <p className="text-muted-foreground mt-1">Temukan peluang kerja atau tasker terbaik untuk proyek Anda.</p>
                </div>
                <Button asChild className="shrink-0 bg-primary">
                    <Link href="/board/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Postingan Baru
                    </Link>
                </Button>
            </div>

            <div className="flex gap-2 mb-8 p-1 bg-muted/40 rounded-xl w-fit border border-border/50 shadow-sm">
                <Button
                    variant={activeTab === 'JOB' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('JOB')}
                    className="rounded-lg px-6"
                >
                    <Briefcase className="mr-2 h-4 w-4" />
                    Butuh Freelancer (Loker)
                </Button>
                <Button
                    variant={activeTab === 'TALENT' ? 'default' : 'ghost'}
                    onClick={() => { setActiveTab('TALENT'); setFieldFilter(''); }}
                    className="rounded-lg px-6"
                >
                    <Users className="mr-2 h-4 w-4" />
                    Tawarkan Jasa (Promosi)
                </Button>
            </div>

            <form onSubmit={handleSearch} className="mb-8 flex gap-2 w-full max-w-sm">
                <input
                    type="text"
                    placeholder="Saring bidang (cth: Web Developer)..."
                    value={fieldFilter}
                    onChange={(e) => setFieldFilter(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                />
                <Button type="submit" variant="secondary">Cari</Button>
            </form>

            {loading ? (
                <div className="flex justify-center items-center py-32">
                    <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-24 bg-muted/20 rounded-3xl border border-dashed border-primary/20">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                        {activeTab === 'JOB' ? <Briefcase className="h-8 w-8" /> : <Users className="h-8 w-8" />}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Belum ada postingan</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">Jadilah yang pertama membuat postingan di kategori ini dan temukan partner terbaik untuk proyek Anda.</p>
                    <Button asChild variant="outline" className="border-primary/20 hover:bg-primary/5">
                        <Link href="/board/create">Buat Postingan Sekarang</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {posts.map((post) => {
                            const thumbsUp = Math.max(0, post.thumbs_up);
                            const thumbsDown = Math.max(0, post.thumbs_down);

                            const isWarning = thumbsDown >= 10;
                            const isCaution = thumbsDown >= 5 && !isWarning;
                            const isTrusted = thumbsUp >= 25 && !isWarning && !isCaution;
                            const isPopular = thumbsUp >= 10 && !isTrusted && !isWarning && !isCaution;

                            let cardBorder = "border-primary/10 hover:border-primary/40";
                            if (isWarning) cardBorder = "border-2 border-red-500 shadow-red-500/20";
                            else if (isCaution) cardBorder = "border-2 border-yellow-500 shadow-yellow-500/20";

                            return (
                                <motion.div
                                    key={post.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Link href={`/board/${post.id}`}>
                                        <Card className={`h-full hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col bg-card overflow-hidden ${cardBorder}`}>
                                            {/* Top Banner Instead of Square Image */}
                                            <div className="w-full h-48 bg-muted relative border-b border-border/50 flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-violet-500/10 overflow-hidden">
                                                {post.image_url ? (
                                                    <>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                if (e.currentTarget.nextElementSibling) {
                                                                    (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                                                }
                                                            }} />
                                                        <div className="hidden items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary text-white font-extrabold text-2xl shadow-md">
                                                            FI
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary text-white font-extrabold text-2xl shadow-md">
                                                        FI
                                                    </div>
                                                )}
                                            </div>
                                            <CardHeader className="pt-5 pb-3">
                                                <div className="flex flex-col items-start gap-2 mb-3">
                                                    <Badge variant={activeTab === 'JOB' ? 'default' : 'secondary'} className="shadow-sm font-semibold px-3 py-1 text-xs">
                                                        {activeTab === 'JOB' ? 'Loker: Butuh Freelancer' : 'Promosi: Tawarkan Jasa'}
                                                    </Badge>

                                                    {post.post_field && (
                                                        <div className="flex items-center text-xs bg-muted/50 rounded-lg px-3 py-1 font-medium border border-border/50 text-foreground/80">
                                                            <span>{post.post_field}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-1.5 bg-muted/30 px-3 py-1 rounded-lg border border-border/40">
                                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <span className="text-muted-foreground text-xs font-medium">
                                                            {new Date(post.created_at * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Warning and Trusted Badges */}
                                                {(isTrusted || isPopular || isWarning || isCaution) && (
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {isTrusted && <Badge className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm rounded-lg text-[10px] px-2 py-0.5">Trusted</Badge>}
                                                        {isPopular && <Badge className="bg-green-500 hover:bg-green-600 text-white shadow-sm rounded-lg text-[10px] px-2 py-0.5">Populer</Badge>}
                                                        {isWarning && <Badge className="bg-red-500 hover:bg-red-600 text-white shadow-sm rounded-lg text-[10px] px-2 py-0.5 flex gap-1"><ThumbsDown className="w-3 h-3" /> Warning</Badge>}
                                                        {isCaution && <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm rounded-lg text-[10px] px-2 py-0.5 flex gap-1"><ThumbsDown className="w-3 h-3" /> Warning</Badge>}
                                                    </div>
                                                )}

                                                <CardTitle className="line-clamp-2 text-xl block leading-snug group-hover:text-primary transition-colors">{post.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex-grow pb-4">
                                                <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                                                    {post.description}
                                                </p>
                                            </CardContent>
                                            <CardFooter className="pt-3 pb-3 border-t border-border/50 mt-auto flex-col gap-3 rounded-b-xl bg-card">
                                                <div className="flex justify-between items-center w-full px-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                                                            {(post.author_name || 'A').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-medium truncate max-w-[120px] text-foreground/80 text-sm">{post.author_name}</span>
                                                    </div>
                                                    <span className="text-muted-foreground flex items-center text-xs ml-auto shrink-0">
                                                        <MapPin className="w-3.5 h-3.5 mr-1 text-muted-foreground/70" />
                                                        <span className="truncate max-w-[100px]">{post.author_city}</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between w-full px-1 border-t border-border/30 pt-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                                            <ThumbsUp className="w-3.5 h-3.5" />
                                                            {thumbsUp}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                                                            <ThumbsDown className="w-3.5 h-3.5" />
                                                            {thumbsDown}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
