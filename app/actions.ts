'use server';

import { tursoQuery, tursoExecute } from '@/lib/db';
import { revalidatePath } from 'next/cache';
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
        const now = Math.floor(Date.now() / 1000);

        await tursoExecute(
            'INSERT INTO freelancers (id, name, field, province, city, details, portfolio, linkedin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, formData.name, formData.field, formData.province, formData.city, formData.details, formData.portfolio, formData.linkedin, now]
        );

        revalidatePath('/directory');
        return { success: true, userId };
    } catch (error) {
        console.error('Failed to register user:', error);
        return { success: false, error: 'Gagal mendaftar user.' };
    }
}

export async function getFreelancers() {
    try {
        const data = await tursoQuery(
            'SELECT id, name, field, province, city, details, portfolio, linkedin, created_at FROM freelancers ORDER BY created_at DESC'
        );

        return { success: true, data };
    } catch (error: any) {
        console.error('[DB] Failed to fetch freelancers:', error);
        return {
            success: false,
            error: `DB Error: ${error?.message || String(error)}`
        };
    }
}

export async function getUserById(id: string) {
    try {
        const rows = await tursoQuery(
            'SELECT id, name, field, province, city, details, portfolio, linkedin, created_at FROM freelancers WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return { success: false, error: 'User tidak ditemukan.' };
        }

        return { success: true, data: rows[0] };
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
        const setClauses: string[] = [];
        const args: any[] = [];

        if (formData.name !== undefined) { setClauses.push('name = ?'); args.push(formData.name); }
        if (formData.field !== undefined) { setClauses.push('field = ?'); args.push(formData.field); }
        if (formData.province !== undefined) { setClauses.push('province = ?'); args.push(formData.province); }
        if (formData.city !== undefined) { setClauses.push('city = ?'); args.push(formData.city); }
        if (formData.details !== undefined) { setClauses.push('details = ?'); args.push(formData.details); }
        if (formData.portfolio !== undefined) { setClauses.push('portfolio = ?'); args.push(formData.portfolio); }
        if (formData.linkedin !== undefined) { setClauses.push('linkedin = ?'); args.push(formData.linkedin); }

        if (setClauses.length === 0) {
            return { success: false, error: 'Tidak ada data untuk diupdate.' };
        }

        args.push(id);
        await tursoExecute(
            `UPDATE freelancers SET ${setClauses.join(', ')} WHERE id = ?`,
            args
        );

        revalidatePath('/directory');
        revalidatePath('/edit-profile');

        return { success: true };
    } catch (error) {
        console.error('Failed to update user:', error);
        return { success: false, error: 'Gagal update user.' };
    }
}
