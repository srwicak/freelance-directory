'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserById } from '@/app/actions';
import { Loader2, User } from 'lucide-react';

export default function AuthButton() {
    const [loading, setLoading] = useState(true);
    const [firstName, setFirstName] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const storedId = localStorage.getItem('freelancer_access_id');
                if (!storedId) {
                    setFirstName(null);
                    setLoading(false);
                    return;
                }

                const result = await getUserById(storedId);
                if (result.success && result.data?.name) {
                    // Extract first name
                    const nameParts = result.data.name.trim().split(' ');
                    setFirstName(nameParts[0]);
                } else {
                    // if not found or error, just clear state
                    setFirstName(null);
                }
            } catch (error) {
                console.error('Error fetching user auth state:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();

        window.addEventListener('auth-change', fetchUser);
        return () => window.removeEventListener('auth-change', fetchUser);
    }, []);

    if (loading) {
        return (
            <div className="inline-flex items-center justify-center px-5 py-2 min-h-[40px] rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (firstName) {
        return (
            <Link
                href="/edit-profile"
                className="group inline-flex items-center justify-center gap-2 pl-2 pr-4 py-1.5 text-sm font-semibold glass-card rounded-full hover:bg-white/40 dark:hover:bg-zinc-800/40 transition-all min-h-[40px] hover:shadow-md"
            >
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-primary text-white shadow-inner">
                    <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-foreground/80 group-hover:text-foreground transition-colors">
                    Halo, <span className="font-bold text-gradient">{firstName}</span>
                </span>
            </Link>
        );
    }

    return (
        <Link
            href="/register"
            className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-primary-foreground bg-gradient-primary rounded-lg shadow-sm hover:opacity-90 transition-all min-h-[40px]"
        >
            Gabung
        </Link>
    );
}
