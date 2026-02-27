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
    subField?: string;
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
            'INSERT INTO freelancers (id, name, field, sub_field, province, city, details, portfolio, linkedin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, encryptedData.name, encryptedData.field, formData.subField || null, encryptedData.province, encryptedData.city, encryptedData.details, encryptedData.portfolio, encryptedData.linkedin, now]
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
                `SELECT id, name, field, sub_field, province, city, details, portfolio, linkedin, created_at FROM freelancers ${whereClause} ORDER BY created_at DESC`,
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
                const subField = (row.sub_field || '').toLowerCase();
                const province = (row.province || '').toLowerCase();
                const city = (row.city || '').toLowerCase();
                const details = (row.details || '').toLowerCase();

                return (
                    name.includes(searchLower) ||
                    field.includes(searchLower) ||
                    subField.includes(searchLower) ||
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
                `SELECT id, name, field, sub_field, province, city, details, portfolio, linkedin, created_at FROM freelancers ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
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
            'SELECT id, name, field, sub_field, province, city, details, portfolio, linkedin, created_at FROM freelancers WHERE id = ?',
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
    subField?: string;
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
        if (formData.subField !== undefined) { setClauses.push('sub_field = ?'); args.push(formData.subField); }
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

export async function createOpportunity(formData: {
    userId: string;
    type: string;
    title: string;
    description: string;
    field?: string;
    expiresAtDays?: number;
    imageUrl?: string;
}) {
    try {
        const now = Math.floor(Date.now() / 1000);

        const activeCount = await tursoQuery(
            `SELECT count(*) as total FROM opportunities WHERE user_id = ? AND expires_at > ?`,
            [formData.userId, now]
        );
        if (parseInt(activeCount[0]?.total || '0', 10) >= 3) {
            return { success: false, error: `Batas maksimal 3 postingan aktif.` };
        }

        const id = nanoid(10);
        const days = Math.min(Math.max(formData.expiresAtDays || 14, 1), 14);
        const expiresAt = now + (days * 24 * 60 * 60);

        await tursoExecute(
            'INSERT INTO opportunities (id, user_id, type, title, description, field, image_url, created_at, expires_at, edit_count, thumbs_up, thumbs_down) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)',
            [id, formData.userId, formData.type, formData.title, formData.description, formData.field || null, formData.imageUrl || null, now, expiresAt]
        );

        revalidatePath('/board');
        return { success: true, id };
    } catch (error: any) {
        console.error('Failed to create opportunity:', error);
        return { success: false, error: 'Gagal membuat post.' };
    }
}

export async function editOpportunity(id: string, userId: string, formData: {
    title: string;
    description: string;
    field?: string;
    imageUrl?: string;
}) {
    try {
        const rows = await tursoQuery(`SELECT user_id, edit_count FROM opportunities WHERE id = ?`, [id]);
        if (rows.length === 0) return { success: false, error: 'Post tidak ditemukan.' };
        if (rows[0].user_id !== userId) return { success: false, error: 'Tidak ada akses.' };
        if ((rows[0].edit_count as number) >= 3) return { success: false, error: 'Batas maksimal edit tercapai (3 kali).' };

        await tursoExecute(
            `UPDATE opportunities SET title = ?, description = ?, field = ?, image_url = ?, edit_count = edit_count + 1 WHERE id = ?`,
            [formData.title, formData.description, formData.field || null, formData.imageUrl || null, id]
        );

        revalidatePath('/board');
        revalidatePath(`/board/${id}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to edit post:', error);
        return { success: false, error: 'Gagal mengedit post.' };
    }
}

export async function deleteOpportunity(id: string, userId: string) {
    try {
        const rows = await tursoQuery(`SELECT user_id FROM opportunities WHERE id = ?`, [id]);
        if (rows.length === 0) return { success: false, error: 'Post tidak ditemukan.' };
        if (rows[0].user_id !== userId) return { success: false, error: 'Tidak ada akses.' };

        await tursoExecute(`DELETE FROM opportunity_votes WHERE opportunity_id = ?`, [id]);
        await tursoExecute(`DELETE FROM opportunities WHERE id = ?`, [id]);

        revalidatePath('/board');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete post:', error);
        return { success: false, error: 'Gagal menghapus post.' };
    }
}

export async function getOpportunities(type: string, page: number = 1, limit: number = 20, fieldFilter: string = '') {
    try {
        const offset = (page - 1) * limit;
        const now = Math.floor(Date.now() / 1000);

        const conditions = ['o.type = ?', 'o.expires_at > ?'];
        const args: any[] = [type, now];

        if (fieldFilter.trim()) {
            conditions.push('o.field = ?');
            args.push(fieldFilter.trim());
        }

        const whereClause = conditions.join(' AND ');

        const countResult = await tursoQuery(
            `SELECT count(*) as total FROM opportunities o WHERE ${whereClause}`,
            args
        );
        const totalCount = parseInt(countResult[0]?.total || '0', 10);

        const data = await tursoQuery(
            `SELECT o.id, o.type, o.title, o.description, o.field as post_field, o.image_url, o.created_at, o.expires_at, o.thumbs_up, o.thumbs_down, o.user_id, f.name as author_name, f.field as author_field, f.province as author_province, f.city as author_city
             FROM opportunities o
             JOIN freelancers f ON o.user_id = f.id
             WHERE ${whereClause}
             ORDER BY o.created_at DESC
             LIMIT ? OFFSET ?`,
            [...args, limit, offset]
        );

        const decryptedData = await Promise.all(
            data.map(async (row) => {
                return {
                    ...row,
                    author_name: await decrypt(row.author_name as string)
                };
            })
        );

        return {
            success: true,
            data: decryptedData,
            totalCount,
            hasMore: offset + data.length < totalCount,
            page,
        };
    } catch (error: any) {
        return { success: false, error: `DB Error: ${error?.message || String(error)}` };
    }
}

export async function getOpportunityById(id: string) {
    try {
        const rows = await tursoQuery(
            `SELECT o.id, o.type, o.title, o.description, o.field as post_field, o.image_url, o.created_at, o.expires_at, o.edit_count, o.thumbs_up, o.thumbs_down, o.user_id, f.name as author_name, f.field as author_field, f.province as author_province, f.city as author_city, f.linkedin as author_linkedin, f.details as author_details, f.portfolio as author_portfolio
             FROM opportunities o
             JOIN freelancers f ON o.user_id = f.id
             WHERE o.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return { success: false, error: 'Post tidak ditemukan.' };
        }

        const row = rows[0];
        row.author_name = await decrypt(row.author_name as string);
        row.author_details = await decrypt(row.author_details as string);
        row.author_portfolio = await decrypt(row.author_portfolio as string);
        row.author_linkedin = await decrypt(row.author_linkedin as string);

        return { success: true, data: row };
    } catch (error) {
        return { success: false, error: 'Gagal mengambil data post.' };
    }
}

export async function voteOpportunity(opportunityId: string, userId: string, value: number) {
    try {
        if (value !== 1 && value !== -1) return { success: false, error: 'Invalid vote' };

        const existing = await tursoQuery(`SELECT id, value FROM opportunity_votes WHERE opportunity_id = ? AND user_id = ?`, [opportunityId, userId]);

        if (existing.length > 0) {
            const existingValue = Number(existing[0].value);
            if (existingValue === value) {
                // remove vote 
                await tursoExecute(`DELETE FROM opportunity_votes WHERE id = ?`, [existing[0].id]);
                const col = value === 1 ? 'thumbs_up' : 'thumbs_down';
                await tursoExecute(`UPDATE opportunities SET ${col} = MAX(0, ${col} - 1) WHERE id = ?`, [opportunityId]);
            } else {
                // switch vote
                await tursoExecute(`UPDATE opportunity_votes SET value = ? WHERE id = ?`, [value, existing[0].id]);
                if (value === 1) {
                    await tursoExecute(`UPDATE opportunities SET thumbs_up = thumbs_up + 1, thumbs_down = MAX(0, thumbs_down - 1) WHERE id = ?`, [opportunityId]);
                } else {
                    await tursoExecute(`UPDATE opportunities SET thumbs_down = thumbs_down + 1, thumbs_up = MAX(0, thumbs_up - 1) WHERE id = ?`, [opportunityId]);
                }
            }
        } else {
            // new vote
            const newId = nanoid(10);
            await tursoExecute(`INSERT INTO opportunity_votes (id, opportunity_id, user_id, value) VALUES (?, ?, ?, ?)`, [newId, opportunityId, userId, value]);
            const col = value === 1 ? 'thumbs_up' : 'thumbs_down';
            await tursoExecute(`UPDATE opportunities SET ${col} = ${col} + 1 WHERE id = ?`, [opportunityId]);
        }
        revalidatePath(`/board/${opportunityId}`);
        revalidatePath('/board');
        return { success: true };
    } catch (error) {
        console.error('Failed to vote:', error);
        return { success: false, error: 'Gagal memberikan rating.' };
    }
}

export async function getUserVote(opportunityId: string, userId: string) {
    try {
        const rows = await tursoQuery(`SELECT value FROM opportunity_votes WHERE opportunity_id = ? AND user_id = ?`, [opportunityId, userId]);
        if (rows.length > 0) return { success: true, value: rows[0].value };
        return { success: true, value: 0 };
    } catch (error) {
        return { success: false, value: 0 };
    }
}

export async function getActivePostCount(userId: string) {
    try {
        const now = Math.floor(Date.now() / 1000);
        const countResult = await tursoQuery(
            `SELECT count(*) as total FROM opportunities WHERE user_id = ? AND expires_at > ?`,
            [userId, now]
        );
        return { success: true, count: parseInt(countResult[0]?.total || '0', 10) };
    } catch (error) {
        return { success: false, count: 0 };
    }
}
