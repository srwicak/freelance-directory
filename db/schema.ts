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
    subField: text('sub_field'),
    province: text('province').notNull(),
    city: text('city').notNull(),
    details: text('details'),
    portfolio: text('portfolio'),
    linkedin: text('linkedin').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const opportunities = sqliteTable('opportunities', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    type: text('type').notNull(), // 'JOB' or 'TALENT'
    title: text('title').notNull(),
    description: text('description').notNull(),
    field: text('field'), // Bidang Keahlian
    imageUrl: text('image_url'), // Optional ImgBB or similar valid URL
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    editCount: integer('edit_count').notNull().default(0),
    thumbsUp: integer('thumbs_up').notNull().default(0),
    thumbsDown: integer('thumbs_down').notNull().default(0),
});

export const opportunityVotes = sqliteTable('opportunity_votes', {
    id: text('id').primaryKey(),
    opportunityId: text('opportunity_id').notNull().references(() => opportunities.id),
    userId: text('user_id').notNull().references(() => users.id),
    value: integer('value').notNull() // 1 for up, -1 for down
});
