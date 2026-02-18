import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    whatsapp: text('whatsapp').notNull(),
    field: text('field').notNull(), // Bidang Keahlian
    province: text('province').notNull(),
    city: text('city').notNull(),
    details: text('details'),
    portfolio: text('portfolio'),
    linkedin: text('linkedin'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});
