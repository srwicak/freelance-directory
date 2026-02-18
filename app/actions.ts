'use server';

import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function registerUser(formData: {
    name: string;
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

export async function getUserById(id: string) {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, id),
        });

        if (!user) {
            return { success: false, error: 'User tidak ditemukan.' };
        }

        return { success: true, data: user };
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return { success: false, error: 'Gagal mengambil data user.' };
    }
}

export async function updateUser(id: string, formData: {
    name?: string;
    field?: string;
    province?: string;
    city?: string;
    details?: string;
    portfolio?: string;
    linkedin?: string;
}) {
    try {
        await db.update(users)
            .set({
                ...formData,
                // Ensure field naming matches schema if needed, schema uses same names so it's fine
            })
            .where(eq(users.id, id));

        revalidatePath('/directory');
        revalidatePath(`/edit-profile`); // If we have a dynamic route later

        return { success: true };
    } catch (error) {
        console.error('Failed to update user:', error);
        return { success: false, error: 'Gagal update user.' };
    }
}
