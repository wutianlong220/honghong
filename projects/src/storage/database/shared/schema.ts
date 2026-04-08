import { pgTable, serial, timestamp, index, pgPolicy, varchar, text, unique, uuid, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	summary: text().notNull(),
	content: text().notNull(),
	author: varchar({ length: 100 }).default('哄哄模拟器团队').notNull(),
	tags: text().default('').notNull(),
	readTime: varchar("read_time", { length: 20 }).default('3分钟').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("blog_posts_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	pgPolicy("blog_posts_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("blog_posts_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("blog_posts_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("blog_posts_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 50 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("users_username_idx").using("btree", table.username.asc().nullsLast().op("text_ops")),
	unique("users_username_key").on(table.username),
	pgPolicy("Allow public delete on users", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("Allow public update on users", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Allow public insert on users", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Allow public read on users", { as: "permissive", for: "select", to: ["public"] }),
]);

// 游戏记录表
export const gameRecords = pgTable("game_records", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(), // 关联本地用户
	scenario: varchar({ length: 100 }).notNull(), // 场景名称
	finalScore: integer("final_score").notNull(), // 最终好感度分数
	result: varchar({ length: 20 }).notNull(), // 通关/失败
	playedAt: timestamp("played_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(), // 游戏时间
}, (table) => [
	index("game_records_user_id_idx").using("btree", table.userId.asc().nullsLast()),
	index("game_records_played_at_idx").using("btree", table.playedAt.desc().nullsFirst().op("timestamptz_ops")),
]);
