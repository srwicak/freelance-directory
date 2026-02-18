'use server';

import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function registerUser(formData: {
    name: string;
    whatsapp: string;
    field: string;
    province: string;
    city: string;
    details: string;
    portfolio: string;
    linkedin: string;
}) {
    try {
        const userId = nanoid(10);

        await db.insert(users).values({
            id: userId,
            ...formData,
            createdAt: new Date(),
        });

        revalidatePath('/directory');
        return { success: true, userId };
    } catch (error) {
        console.error('Failed to register user:', error);
        return { success: false, error: 'Gagal mendaftar user.' };
    }
}

export async function getFreelancers() {
    try {
        const data = await db.query.users.findMany({
            orderBy: [desc(users.createdAt)],
        });
        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch freelancers:', error);
        return { success: false, error: 'Gagal mengambil data freelancer.' };
    }
}
