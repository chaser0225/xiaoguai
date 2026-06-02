import { pgTable, serial, timestamp, varchar, text, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const shoppingItems = pgTable(
  "shopping_items",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    taobao_url: text("taobao_url"),
    image_url: text("image_url"),
    price: varchar("price", { length: 50 }),
    source_type: varchar("source_type", { length: 20 }).notNull().default("manual"),
    raw_input: text("raw_input"),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    added_at: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("shopping_items_status_idx").on(table.status),
    index("shopping_items_added_at_idx").on(table.added_at),
  ]
);
