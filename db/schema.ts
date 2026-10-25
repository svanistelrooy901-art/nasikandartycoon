import {sqliteTable,text,integer,index,primaryKey} from 'drizzle-orm/sqlite-core';
export const players=sqliteTable('players',{
 id:text('id').primaryKey(), tokenHash:text('token_hash').notNull().unique(),name:text('name').notNull(),
 wallet:integer('wallet').notNull().default(0),totalSales:integer('total_sales').notNull().default(0),totalTips:integer('total_tips').notNull().default(0),
 shop:text('shop').notNull(),bestCombo:integer('best_combo').notNull().default(0),shifts:integer('shifts').notNull().default(0),revision:integer('revision').notNull().default(0),createdAt:integer('created_at').notNull()
});
export const runs=sqliteTable('runs',{id:text('id').primaryKey(),playerId:text('player_id').notNull().references(()=>players.id),state:text('state').notNull(),status:text('status').notNull(),updatedAt:integer('updated_at').notNull(),revision:integer('revision').notNull().default(0)},t=>[index('runs_player').on(t.playerId)]);
export const sales=sqliteTable('sales',{id:text('id').primaryKey(),playerId:text('player_id').notNull().references(()=>players.id),runId:text('run_id').notNull(),amount:integer('amount').notNull(),createdAt:integer('created_at').notNull()},t=>[index('sales_week').on(t.createdAt)]);

export const googleAccounts=sqliteTable('google_accounts',{googleSub:text('google_sub').primaryKey(),playerId:text('player_id').notNull().unique().references(()=>players.id),createdAt:integer('created_at').notNull()});
export const playerSessions=sqliteTable('player_sessions',{tokenHash:text('token_hash').primaryKey(),playerId:text('player_id').notNull().references(()=>players.id),expiresAt:integer('expires_at').notNull()},t=>[index('sessions_player').on(t.playerId)]);
export const authChallenges=sqliteTable('auth_challenges',{nonceHash:text('nonce_hash').primaryKey(),playerId:text('player_id').notNull().references(()=>players.id),expiresAt:integer('expires_at').notNull()});

export const leagues=sqliteTable('leagues',{id:text('id').primaryKey(),name:text('name').notNull(),ownerId:text('owner_id').notNull().references(()=>players.id),inviteCode:text('invite_code').notNull().unique(),createdAt:integer('created_at').notNull()},t=>[index('leagues_owner').on(t.ownerId)]);
export const leagueMembers=sqliteTable('league_members',{leagueId:text('league_id').notNull().references(()=>leagues.id),playerId:text('player_id').notNull().references(()=>players.id),joinedAt:integer('joined_at').notNull()},t=>[primaryKey({columns:[t.leagueId,t.playerId]}),index('league_members_player').on(t.playerId)]);
