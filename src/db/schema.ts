import { pgTable, text, timestamp, boolean, pgEnum, varchar, numeric, integer, primaryKey, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
export const userRoleEnum = pgEnum('user_role', ['customer', 'fixman', 'admin']);
export const jobStatusEnum = pgEnum('job_status', [
    'requested', 'matching', 'assigned', 'accepted', 'on_the_way', 'in_progress', 'completed', 'requires_revision', 'closed', 'cancelled'
]);
export const paymentStatusEnum = pgEnum('payment_status', ['none', 'intent_created', 'authorized', 'captured', 'refunded', 'failed']);
export const offerStatusEnum = pgEnum('offer_status', ['sent', 'viewed', 'accepted', 'declined', 'expired']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'verified', 'rejected']);

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified")
        .$defaultFn(() => false)
        .notNull(),
    image: text("image"),
    role: userRoleEnum('role').default('customer').notNull(),
    createdAt: timestamp("created_at")
        .$defaultFn(() => /* @__PURE__ */ new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => /* @__PURE__ */ new Date())
        .notNull(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").$defaultFn(
        () => /* @__PURE__ */ new Date(),
    ),
    updatedAt: timestamp("updated_at").$defaultFn(
        () => /* @__PURE__ */ new Date(),
    ),
});

export const addresses = pgTable('addresses', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 100 }), // "Home", "Office"
    line1: varchar('line1', { length: 200 }),
    line2: varchar('line2', { length: 200 }),
    city: varchar('city', { length: 120 }),
    state: varchar('state', { length: 120 }),
    postalCode: varchar('postal_code', { length: 20 }),
    country: varchar('country', { length: 2 }).default('IN'),
    // store lat/lng; create a generated point column in a migration (raw SQL)
    lat: numeric('lat', { precision: 10, scale: 7 }),
    lng: numeric('lng', { precision: 10, scale: 7 }),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
    id: text('id').primaryKey(),
    name: varchar('name', { length: 120 }).notNull().unique(), // "AC Repair"
    parentId: text('parent_id'),
    icon: varchar('icon', { length: 100 }),
    description: varchar('description', { length: 400 }),
    isActive: boolean('is_active').default(true),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    parent: one(categories, {
        fields: [categories.parentId],
        references: [categories.id],
    }),
    children: many(categories),
}));

export const skills = pgTable('skills', {
    id: text('id').primaryKey(),
    categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 120 }).notNull().unique(), // "Split AC - Gas Refill"
    isActive: boolean('is_active').default(true),
});

// ---------- Providers (Fixmen) ----------
export const providers = pgTable('providers', {
    id: text('id').primaryKey(),
    verificationStatus: verificationStatusEnum('verification_status').default('pending').notNull(),
    about: varchar('about', { length: 400 }),
    serviceRadiusKm: numeric('service_radius_km', { precision: 5, scale: 2 }).default('10'),
    baseLat: numeric('base_lat', { precision: 10, scale: 7 }),
    baseLng: numeric('base_lng', { precision: 10, scale: 7 }),
    avgRating: numeric('avg_rating', { precision: 3, scale: 2 }).default('5'),
    jobsDone: integer('jobs_done').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const providerSkills = pgTable('provider_skills', {
    providerId: text('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
    skillId: text('skill_id').notNull().references(() => skills.id, { onDelete: 'cascade' }),
}, (t) => [
    primaryKey({ columns: [t.providerId, t.skillId] })
]);

export const providerAvailability = pgTable('provider_availability', {
    id: text('id').primaryKey(),
    providerId: text('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
    // weekly pattern or specific date ranges (ISO strings)
    rule: jsonb('rule').$type<{ type: 'weekly' | 'range', data: any }>().notNull(),
    timezone: varchar('timezone', { length: 64 }).default('Asia/Kolkata'),
});


export const serviceRequests = pgTable('service_requests', {
    id: text('id').primaryKey(),
    customerId: text('customer_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    categoryId: text('category_id').references(() => categories.id),
    skillId: text('skill_id').references(() => skills.id),
    // snapshot address & coords at request time
    addressId: text('address_id').references(() => addresses.id),
    addressSnapshot: jsonb('address_snapshot'), // denormalized for history
    lat: numeric('lat', { precision: 10, scale: 7 }),
    lng: numeric('lng', { precision: 10, scale: 7 }),
    description: varchar('description', { length: 1000 }),
    photos: jsonb('photos').$type<string[]>(),
    preferredTimeFrom: timestamp('preferred_time_from'),
    preferredTimeTo: timestamp('preferred_time_to'),
    status: jobStatusEnum('status').default('requested').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const offers = pgTable('offers', {
    id: text('id').primaryKey(),
    requestId: text('request_id').notNull().references(() => serviceRequests.id, { onDelete: 'cascade' }),
    providerId: text('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
    status: offerStatusEnum('status').default('sent').notNull(),
    expiresAt: timestamp('expires_at'),
    score: numeric('score', { precision: 6, scale: 3 }), // matching score for audit
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
    requestProviderIdx: index('offers_req_prov_idx').on(t.requestId, t.providerId),
}));

export const jobs = pgTable('jobs', {
    id: text('id').primaryKey(),
    requestId: text('request_id').notNull().references(() => serviceRequests.id, { onDelete: 'cascade' }),
    customerId: text('customer_id').notNull().references(() => user.id),
    providerId: text('provider_id').notNull().references(() => providers.id),
    scheduledAt: timestamp('scheduled_at'),
    status: jobStatusEnum('status').default('assigned').notNull(),
    etaMinutes: integer('eta_minutes'),
    checklist: jsonb('checklist').$type<Array<{ name: string; done: boolean }>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const quotes = pgTable('quotes', {
    id: text('id').primaryKey(),
    jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 30 }).default('estimate'), // estimate/final
    currency: varchar('currency', { length: 3 }).default('INR'),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).default('0'),
    tax: numeric('tax', { precision: 10, scale: 2 }).default('0'),
    discount: numeric('discount', { precision: 10, scale: 2 }).default('0'),
    total: numeric('total', { precision: 10, scale: 2 }).default('0'),
    lineItems: jsonb('line_items').$type<Array<{ title: string; qty: number; price: number }>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
    id: text('id').primaryKey(), // gateway payment id
    jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
    status: paymentStatusEnum('status').default('none').notNull(),
    providerFeePct: numeric('provider_fee_pct', { precision: 5, scale: 2 }).default('80'), // provider payout %
    platformFee: numeric('platform_fee', { precision: 10, scale: 2 }).default('0'),
    amountAuthorized: numeric('amount_authorized', { precision: 10, scale: 2 }),
    amountCaptured: numeric('amount_captured', { precision: 10, scale: 2 }),
    externalRef: jsonb('external_ref'), // gateway metadata
    createdAt: timestamp('created_at').defaultNow().notNull(),
    capturedAt: timestamp('captured_at'),
});

export const reviews = pgTable('reviews', {
    id: text('id').primaryKey(),
    jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
    byUserId: text('by_user_id').notNull().references(() => user.id),
    forUserId: text('for_user_id').notNull().references(() => user.id),
    rating: integer('rating').notNull(), // 1..5
    comment: varchar('comment', { length: 1000 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
    jobIdx: index('reviews_job_idx').on(t.jobId),
}));


export const conversations = pgTable('conversations', {
    id: text('id').primaryKey(),
    jobId: text('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const conversationMembers = pgTable('conversation_members', {
    conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
}, (t) => [
    primaryKey({ columns: [t.conversationId, t.userId] })
]);

export const messages = pgTable('messages', {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: text('sender_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    body: varchar('body', { length: 2000 }),
    attachments: jsonb('attachments').$type<string[]>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const devices = pgTable('devices', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    expoPushToken: varchar('expo_push_token', { length: 300 }),
    fcmToken: varchar('fcm_token', { length: 300 }),
    platform: varchar('platform', { length: 20 }), // ios/android
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }),
    payload: jsonb('payload'),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});