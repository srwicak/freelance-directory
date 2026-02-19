'use server';

import { tursoQuery, tursoExecute } from '@/lib/db';
import { encrypt, decrypt, encryptFields, decryptFields } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';

// Fields that should be encrypted in the database
const ENCRYPTED_FIELDS = ['name', 'details', 'portfolio', 'linkedin'] as const;

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

        // Encrypt sensitive fields before storing
        const encryptedData = await encryptFields(formData, [...ENCRYPTED_FIELDS]);

        await tursoExecute(
            'INSERT INTO freelancers (id, name, field, province, city, details, portfolio, linkedin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, encryptedData.name, encryptedData.field, encryptedData.province, encryptedData.city, encryptedData.details, encryptedData.portfolio, encryptedData.linkedin, now]
        );

        revalidatePath('/directory');
        return { success: true, userId };
    } catch (error) {
        console.error('Failed to register user:', error);
        return { success: false, error: 'Gagal mendaftar user.' };
    }
}

export async function getFreelancers(
    page: number = 1,
    limit: number = 20,
    search: string = '',
    fieldFilter: string = ''
) {
    try {
        const hasSearch = search.trim().length > 0;
        const searchLower = search.trim().toLowerCase();

        // --- DB-level filter: only non-encrypted fields (fieldFilter) ---
        const dbConditions: string[] = [];
        const dbArgs: any[] = [];

        if (fieldFilter.trim()) {
            dbConditions.push('field = ?');
            dbArgs.push(fieldFilter.trim());
        }

        const whereClause = dbConditions.length > 0 ? `WHERE ${dbConditions.join(' AND ')}` : '';

        // If there's a text search, we need to fetch ALL rows (filtered by fieldFilter at DB level),
        // decrypt them, then filter by search term in application code.
        // If no text search, we can paginate at DB level for efficiency.

        if (hasSearch) {
            // Fetch all rows (with fieldFilter applied at DB level)
            const allData = await tursoQuery(
                `SELECT id, name, field, province, city, details, portfolio, linkedin, created_at FROM freelancers ${whereClause} ORDER BY created_at DESC`,
                dbArgs
            );

            // Decrypt all rows
            const decryptedAll = await Promise.all(
                allData.map(row => decryptFields(row, [...ENCRYPTED_FIELDS]))
            );

            // Application-level search across ALL fields (including encrypted ones like name)
            const filtered = decryptedAll.filter(row => {
                const name = (row.name || '').toLowerCase();
                const field = (row.field || '').toLowerCase();
                const province = (row.province || '').toLowerCase();
                const city = (row.city || '').toLowerCase();
                const details = (row.details || '').toLowerCase();

                return (
                    name.includes(searchLower) ||
                    field.includes(searchLower) ||
                    province.includes(searchLower) ||
                    city.includes(searchLower) ||
                    details.includes(searchLower)
                );
            });

            // Apply pagination on filtered results
            const offset = (page - 1) * limit;
            const paginated = filtered.slice(offset, offset + limit);

            return {
                success: true,
                data: paginated,
                totalCount: filtered.length,
                hasMore: offset + paginated.length < filtered.length,
                page,
            };
        } else {
            // No text search — paginate at DB level (more efficient)
            const offset = (page - 1) * limit;

            // Get total count
            const countResult = await tursoQuery(
                `SELECT count(*) as total FROM freelancers ${whereClause}`,
                dbArgs
            );
            const totalCount = parseInt(countResult[0]?.total || '0', 10);

            // Get paginated data
            const pageArgs = [...dbArgs, limit, offset];
            const data = await tursoQuery(
                `SELECT id, name, field, province, city, details, portfolio, linkedin, created_at FROM freelancers ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
                pageArgs
            );

            // Decrypt sensitive fields
            const decryptedData = await Promise.all(
                data.map(row => decryptFields(row, [...ENCRYPTED_FIELDS]))
            );

            return {
                success: true,
                data: decryptedData,
                totalCount,
                hasMore: offset + data.length < totalCount,
                page,
            };
        }
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

        // Decrypt sensitive fields
        const decryptedRow = await decryptFields(rows[0], [...ENCRYPTED_FIELDS]);

        return { success: true, data: decryptedRow };
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
        // Encrypt sensitive fields before updating
        const encryptedData = await encryptFields(formData, [...ENCRYPTED_FIELDS]);

        const setClauses: string[] = [];
        const args: any[] = [];

        if (encryptedData.name !== undefined) { setClauses.push('name = ?'); args.push(encryptedData.name); }
        if (encryptedData.field !== undefined) { setClauses.push('field = ?'); args.push(encryptedData.field); }
        if (encryptedData.province !== undefined) { setClauses.push('province = ?'); args.push(encryptedData.province); }
        if (encryptedData.city !== undefined) { setClauses.push('city = ?'); args.push(encryptedData.city); }
        if (encryptedData.details !== undefined) { setClauses.push('details = ?'); args.push(encryptedData.details); }
        if (encryptedData.portfolio !== undefined) { setClauses.push('portfolio = ?'); args.push(encryptedData.portfolio); }
        if (encryptedData.linkedin !== undefined) { setClauses.push('linkedin = ?'); args.push(encryptedData.linkedin); }

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
