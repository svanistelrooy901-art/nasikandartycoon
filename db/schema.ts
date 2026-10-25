import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const players=sqliteTable('players',{
 id:text('id').primaryKey(), tokenHash:text('token_hash').notNull().unique(),name:text('name').notNull(),
 wallet:integer('wallet').notNull().default(0),totalSales:integer('total_sales').notNull().default(0),totalTips:integer('total_tips').notNull().default(0),
 shop:text('shop').notNull(),bestCombo:integer('best_combo').notNull().default(0),shifts:integer('shifts').notNull().default(0),revision:integer('revision').notNull().default(0),createdAt:integer('created_at').notNull()
});
export const runs=sqliteTable('runs',{id:text('id').primaryKey(),playerId:text('player_id').notNull().references(()=>players.id),state:text('state').notNull(),status:text('status').notNull(),updatedAt:integer('updated_at').notNull(),revision:integer('revision').notNull().default(0)},t=>[index('runs_player').on(t.playerId)]);
export const sales=sqliteTable('sales',{id:text('id').primaryKey(),playerId:text('player_id').notNull().references(()=>players.id),runId:text('run_id').notNull(),amount:integer('amount').notNull(),createdAt:integer('created_at').notNull()},t=>[index('sales_week').on(t.createdAt)]);
