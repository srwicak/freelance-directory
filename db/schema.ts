import { sqliteTable, text, integer, customType } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
// import { encrypt, decrypt } from '../lib/encryption';

// const encryptedText = customType<{ data: string; driverData: string }>({
//     dataType() {
//         return 'text';
//     },
//     toDriver(value: string): string {
//         return encrypt(value);
//     },
//     fromDriver(value: string): string {
//         return decrypt(value);
//     },
// });

// export const users = sqliteTable('users', {
//     id: text('id').primaryKey(),
//     name: encryptedText('name').notNull(),
//     field: text('field').notNull(), // Bidang Keahlian
//     province: text('province').notNull(),
//     city: text('city').notNull(),
//     details: encryptedText('details'),
//     portfolio: encryptedText('portfolio'),
//     linkedin: encryptedText('linkedin').notNull(),
//     createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
// });

// DEBUG: Plain text version to test connection
export const users = sqliteTable('freelancers', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    field: text('field').notNull(),
    province: text('province').notNull(),
    city: text('city').notNull(),
    details: text('details'),
    portfolio: text('portfolio'),
    linkedin: text('linkedin').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});
