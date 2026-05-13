CREATE TABLE "allowed_emails" (
	"email" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"registration_id" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"email" text NOT NULL,
	"birthday" text DEFAULT '' NOT NULL,
	"department" text DEFAULT '' NOT NULL,
	"business_unit" text DEFAULT '' NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_registration_id_unique" UNIQUE("registration_id")
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"email" text NOT NULL,
	"birthday" text DEFAULT '' NOT NULL,
	"department" text DEFAULT '' NOT NULL,
	"business_unit" text DEFAULT '' NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registrations_email_unique" UNIQUE("email")
);
