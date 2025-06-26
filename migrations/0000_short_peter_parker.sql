CREATE TABLE "backtest_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"strategy" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"total_trades" integer NOT NULL,
	"winning_trades" integer NOT NULL,
	"losing_trades" integer NOT NULL,
	"total_pl" numeric(12, 2) NOT NULL,
	"max_drawdown" numeric(10, 2) NOT NULL,
	"sharpe_ratio" numeric(5, 2),
	"win_rate" numeric(5, 2) NOT NULL,
	"avg_win" numeric(10, 2) NOT NULL,
	"avg_loss" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historical_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"underlying" text NOT NULL,
	"date" timestamp NOT NULL,
	"open" numeric(10, 2) NOT NULL,
	"high" numeric(10, 2) NOT NULL,
	"low" numeric(10, 2) NOT NULL,
	"close" numeric(10, 2) NOT NULL,
	"volume" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iron_condor_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"underlying" text NOT NULL,
	"expiry" text NOT NULL,
	"put_buy_strike" integer NOT NULL,
	"put_sell_strike" integer NOT NULL,
	"call_sell_strike" integer NOT NULL,
	"call_buy_strike" integer NOT NULL,
	"put_buy_price" numeric(10, 2) NOT NULL,
	"put_sell_price" numeric(10, 2) NOT NULL,
	"call_sell_price" numeric(10, 2) NOT NULL,
	"call_buy_price" numeric(10, 2) NOT NULL,
	"net_premium" numeric(10, 2) NOT NULL,
	"max_profit" numeric(10, 2) NOT NULL,
	"max_loss" numeric(10, 2) NOT NULL,
	"capital" numeric(12, 2) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"current_pl" numeric(10, 2) DEFAULT '0.00',
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"underlying" text NOT NULL,
	"spot_price" numeric(10, 2) NOT NULL,
	"change" numeric(10, 2) NOT NULL,
	"change_percent" numeric(5, 2) NOT NULL,
	"market_status" text NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "options_chain" (
	"id" serial PRIMARY KEY NOT NULL,
	"underlying" text NOT NULL,
	"expiry" text NOT NULL,
	"strike" integer NOT NULL,
	"pe_ltp" numeric(10, 2),
	"ce_ltp" numeric(10, 2),
	"pe_volume" integer,
	"ce_volume" integer,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "smart_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"underlying" text NOT NULL,
	"expiry" text NOT NULL,
	"put_buy_strike" integer NOT NULL,
	"put_sell_strike" integer NOT NULL,
	"call_sell_strike" integer NOT NULL,
	"call_buy_strike" integer NOT NULL,
	"risk_reward" numeric(5, 2) NOT NULL,
	"success_probability" integer NOT NULL,
	"max_profit" numeric(10, 2) NOT NULL,
	"max_loss" numeric(10, 2) NOT NULL,
	"strategy" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trading_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"underlying" text NOT NULL,
	"signal_type" text NOT NULL,
	"candle_analysis" jsonb NOT NULL,
	"confidence" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_capital" (
	"id" serial PRIMARY KEY NOT NULL,
	"total_capital" numeric(12, 2) NOT NULL,
	"available_capital" numeric(12, 2) NOT NULL,
	"used_capital" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
