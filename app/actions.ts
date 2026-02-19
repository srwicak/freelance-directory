'use server';


import { getDb, getClient } from '@/lib/db';
import { users } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { desc, eq, sql } from 'drizzle-orm';
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
        const db = getDb();

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
        const client = getClient();
        console.log('[DB] Fetching freelancers via raw SQL...');

        // Use raw SQL via the client directly — bypass Drizzle entirely
        const result = await client.execute(
            'SELECT id, name, field, province, city, details, portfolio, linkedin, created_at FROM freelancers ORDER BY created_at DESC'
        );

        console.log('[DB] Raw query success. Rows:', result.rows.length);

        // Map raw rows to typed objects
        const data = result.rows.map((row: any) => ({
            id: row.id ?? row[0],
            name: row.name ?? row[1],
            field: row.field ?? row[2],
            province: row.province ?? row[3],
            city: row.city ?? row[4],
            details: row.details ?? row[5],
            portfolio: row.portfolio ?? row[6],
            linkedin: row.linkedin ?? row[7],
            createdAt: row.created_at ?? row[8],
        }));

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
        const client = getClient();
        const result = await client.execute({
            sql: 'SELECT id, name, field, province, city, details, portfolio, linkedin, created_at FROM freelancers WHERE id = ?',
            args: [id],
        });

        if (result.rows.length === 0) {
            return { success: false, error: 'User tidak ditemukan.' };
        }

        const row: any = result.rows[0];
        const user = {
            id: row.id ?? row[0],
            name: row.name ?? row[1],
            field: row.field ?? row[2],
            province: row.province ?? row[3],
            city: row.city ?? row[4],
            details: row.details ?? row[5],
            portfolio: row.portfolio ?? row[6],
            linkedin: row.linkedin ?? row[7],
            createdAt: row.created_at ?? row[8],
        };

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
        const client = getClient();

        // Build SET clause dynamically
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
        const sqlStr = `UPDATE freelancers SET ${setClauses.join(', ')} WHERE id = ?`;

        await client.execute({ sql: sqlStr, args });

        revalidatePath('/directory');
        revalidatePath(`/edit-profile`);

        return { success: true };
    } catch (error) {
        console.error('Failed to update user:', error);
        return { success: false, error: 'Gagal update user.' };
    }
}

export async function registerUserRaw(formData: {
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
        const client = getClient();
        const now = Math.floor(Date.now() / 1000);

        await client.execute({
            sql: 'INSERT INTO freelancers (id, name, field, province, city, details, portfolio, linkedin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            args: [userId, formData.name, formData.field, formData.province, formData.city, formData.details, formData.portfolio, formData.linkedin, now],
        });

        revalidatePath('/directory');
        return { success: true, userId };
    } catch (error) {
        console.error('Failed to register user:', error);
        return { success: false, error: 'Gagal mendaftar user.' };
    }
}
