'use client';
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { getOpportunityById, voteOpportunity, deleteOpportunity, getUserVote } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, MapPin, Calendar, Briefcase, ExternalLink, LockKeyhole, User, Linkedin, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function OpportunityDetailPage() {
    const params = useParams() as { id: string };
    const router = useRouter();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viewerId, setViewerId] = useState<string | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const [userVote, setUserVote] = useState<number>(0);

    useEffect(() => {
        const storedId = localStorage.getItem('freelancer_access_id');
        setViewerId(storedId);
        if (storedId) {
            setIsAuthorized(true);
            fetchUserVote(params.id, storedId);
        }
        fetchPost(params.id);
    }, [params.id]);

    const fetchUserVote = async (postId: string, userId: string) => {
        const res = await getUserVote(postId, userId);
        if (res.success) setUserVote(res.value);
    };

    const fetchPost = async (id: string) => {
        try {
            const res = await getOpportunityById(id);
            if (res.success) setPost(res.data);
            else setPost(null);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (value: number) => {
        if (!viewerId) return;
        const oldVote = userVote;
        const newVote = oldVote === value ? 0 : value;
        setUserVote(newVote); // optimistic update

        const res = await voteOpportunity(post.id, viewerId, value);
        if (res.success) fetchPost(params.id);
    };

    const handleDelete = async () => {
        if (!viewerId) return;
        if (!confirmDelete) {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 4000);
            return;
        }

        const res = await deleteOpportunity(post.id, viewerId);
        if (res.success) {
            router.push('/board');
        } else {
            alert(res.error || "Gagal menghapus.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-40">
                <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex flex-col items-center py-20 px-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4 text-destructive">
                    <Briefcase className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Postingan Tidak Ditemukan</h3>
                <p className="text-muted-foreground mb-6">Postingan ini mungkin telah dihapus atau kedaluwarsa.</p>
                <Button asChild><Link href="/board">Kembali ke Board</Link></Button>
            </div>
        );
    }

    let cardBorder = "border-0 shadow-lg shadow-black/5";

    const thumbsUp = Math.max(0, post.thumbs_up);
    const thumbsDown = Math.max(0, post.thumbs_down);

    const isWarning = thumbsDown >= 10;
    const isCaution = thumbsDown >= 5 && !isWarning;
    const isTrusted = thumbsUp >= 25 && !isWarning && !isCaution;
    const isPopular = thumbsUp >= 10 && !isTrusted && !isWarning && !isCaution;

    if (isWarning) cardBorder = "border-2 border-red-500 shadow-red-500/20";
    else if (isCaution) cardBorder = "border-2 border-yellow-500 shadow-yellow-500/20";

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl animate-in fade-in duration-500">
            <Link href="/board" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Board
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className={`${cardBorder} overflow-hidden transition-all duration-300`}>
                        <div className="w-full h-64 md:h-80 bg-muted relative flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-b border-border/50">
                            {post.image_url ? (
                                <img src={post.image_url} alt={post.title} className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        if (e.currentTarget.nextElementSibling) {
                                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                        }
                                    }} />
                            ) : null}
                            <div className={`${post.image_url ? 'hidden' : 'flex'} items-center justify-center w-24 h-24 rounded-3xl bg-gradient-primary text-white font-extrabold text-4xl shadow-md`}>
                                FI
                            </div>
                        </div>

                        <CardHeader className="pb-4">
                            <div className="flex flex-col items-start gap-3 mb-4">
                                <Badge variant={post.type === 'JOB' ? 'default' : 'secondary'} className="px-3 py-1 font-semibold">
                                    {post.type === 'JOB' ? 'Loker: Butuh Freelancer' : 'Promosi: Tawarkan Jasa'}
                                </Badge>
                                {post.post_field && (
                                    <Badge variant="outline" className="text-xs bg-muted/50 truncate">
                                        {post.post_field}
                                    </Badge>
                                )}
                                <span className="text-sm border border-border/40 text-muted-foreground flex items-center bg-muted/30 px-3 py-1 rounded-md">
                                    <Calendar className="w-4 h-4 mr-1.5" />
                                    {new Date(post.created_at * 1000).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                {(Math.max(0, post.thumbs_up) >= 10 || Math.max(0, post.thumbs_down) >= 5) && (
                                    <div className="flex gap-2 mt-1">
                                        {isTrusted && <Badge className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm">Trusted</Badge>}
                                        {isPopular && <Badge className="bg-green-500 hover:bg-green-600 text-white shadow-sm">Populer</Badge>}
                                        {isWarning && <Badge className="bg-red-500 hover:bg-red-600 text-white shadow-sm flex gap-1"><ThumbsDown className="w-3 h-3" /> Warning</Badge>}
                                        {isCaution && <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm flex gap-1"><ThumbsDown className="w-3 h-3" /> Warning</Badge>}
                                    </div>
                                )}
                            </div>
                            <CardTitle className="text-3xl font-bold leading-tight text-foreground/90">{post.title}</CardTitle>
                        </CardHeader>

                        <CardContent className="pt-2 pb-8">
                            <div className={`relative mb-8 ${!isAuthorized ? 'min-h-[300px]' : ''}`}>
                                {!isAuthorized && (
                                    <div className="absolute -inset-2 md:-inset-4 z-10 flex flex-col items-center justify-center backdrop-blur-xl bg-background/60 rounded-2xl border border-border/50 p-6 text-center shadow-sm">
                                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                            <LockKeyhole className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Konten Terkunci</h3>
                                        <p className="text-muted-foreground mb-6 max-w-sm">Silakan daftar atau masuk sebagai member untuk melihat deskripsi lengkap dan info kontak.</p>
                                        <div className="flex gap-3">
                                            <Button asChild className="bg-gradient-primary text-white"><Link href="/register">Daftar Sekarang</Link></Button>
                                            <Button variant="outline" asChild><Link href="/edit-profile">Log In</Link></Button>
                                        </div>
                                    </div>
                                )}
                                <div className={`prose prose-sm md:prose-base max-w-none text-muted-foreground whitespace-pre-wrap ${!isAuthorized ? 'opacity-20 blur-md select-none pointer-events-none' : ''}`}>
                                    {post.description}
                                </div>
                            </div>

                            {/* VOTING & ACTIONS PORTION */}
                            {isAuthorized && (
                                <div className="flex items-center justify-between border-t border-border/50 pt-6 mt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-sm font-medium text-muted-foreground mr-2">Beri Nilai:</div>
                                        <Button
                                            variant={userVote === 1 ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleVote(1)}
                                            className={`flex items-center gap-2 ${userVote === 1 ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:text-green-600 hover:bg-green-50'}`}
                                        >
                                            <ThumbsUp className="w-4 h-4" /> {Math.max(0, post.thumbs_up)}
                                        </Button>
                                        <Button
                                            variant={userVote === -1 ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleVote(-1)}
                                            className={`flex items-center gap-2 ${userVote === -1 ? 'bg-red-600 hover:bg-red-700 text-white' : 'hover:text-red-600 hover:bg-red-50'}`}
                                        >
                                            <ThumbsDown className="w-4 h-4" /> {Math.max(0, post.thumbs_down)}
                                        </Button>
                                    </div>

                                    {viewerId === post.user_id && (
                                        <Button
                                            variant={confirmDelete ? "destructive" : "outline"}
                                            size="sm"
                                            onClick={handleDelete}
                                            className={confirmDelete ? "animate-pulse" : "text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            {confirmDelete ? "Yakin hapus?" : "Hapus Post"}
                                        </Button>
                                    )}
                                </div>
                            )}

                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-border/50 shadow-md bg-card/50 backdrop-blur sticky top-6">
                        <CardHeader className="pb-4 border-b border-border/50 bg-muted/10">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Diposting Oleh
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 relative">
                            {!isAuthorized && (
                                <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/60 rounded-b-xl flex flex-col items-center justify-center border-t border-border/50">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                                        <LockKeyhole className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-semibold">Informasi Tersembunyi</span>
                                </div>
                            )}

                            <div className={`space-y-4 ${!isAuthorized ? 'opacity-20 blur-md select-none pointer-events-none min-h-[150px]' : ''}`}>
                                <div>
                                    <h4 className="font-bold text-lg">{post.author_name}</h4>
                                    <p className="text-primary text-sm font-medium">{post.author_field}</p>
                                </div>

                                <div className="flex items-center text-sm text-muted-foreground gap-2 bg-muted/30 p-2 rounded-lg">
                                    <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
                                    <span>{post.author_city}, {post.author_province}</span>
                                </div>

                                {post.author_details && (
                                    <div className="text-sm text-muted-foreground border-l-2 border-primary/20 pl-3 italic">
                                        "{post.author_details.length > 100 ? post.author_details.substring(0, 100) + '...' : post.author_details}"
                                    </div>
                                )}

                                <div className="pt-4 flex flex-col gap-2">
                                    {post.author_linkedin && (
                                        <Button asChild variant="default" className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white">
                                            <a href={post.author_linkedin} target="_blank" rel="noopener noreferrer">
                                                <Linkedin className="w-4 h-4 mr-2" />
                                                Profil LinkedIn
                                            </a>
                                        </Button>
                                    )}
                                    {post.author_portfolio && (
                                        <Button asChild variant="outline" className="w-full border-primary/30 hover:bg-primary/5">
                                            <a href={post.author_portfolio} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Lihat Portofolio
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
