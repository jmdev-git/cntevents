import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const registrations = pgTable('registrations', {
  id:           text('id').primaryKey(),
  name:         text('name').notNull().default(''),
  email:        text('email').notNull().unique(),
  birthday:     text('birthday').notNull().default(''),
  department:   text('department').notNull().default(''),
  businessUnit: text('business_unit').notNull().default(''),
  registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
});

export const attendance = pgTable('attendance', {
  id:             text('id').primaryKey(),
  registrationId: text('registration_id').notNull().unique(),
  name:           text('name').notNull().default(''),
  email:          text('email').notNull(),
  birthday:       text('birthday').notNull().default(''),
  department:     text('department').notNull().default(''),
  businessUnit:   text('business_unit').notNull().default(''),
  scannedAt:      timestamp('scanned_at', { withTimezone: true }).notNull().defaultNow(),
});

export const allowedEmails = pgTable('allowed_emails', {
  email: text('email').primaryKey(),
});
