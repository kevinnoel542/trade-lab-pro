-- ============================================================
-- TradeVault — MySQL Schema
-- Run this once to set up the database.
-- ============================================================

CREATE DATABASE IF NOT EXISTS tradevault
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tradevault;

-- ─── Trading Accounts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS trading_accounts (
  id          CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  user_id     VARCHAR(100)  NOT NULL DEFAULT 'local',
  name        VARCHAR(255)  NOT NULL,
  type        VARCHAR(50)   NOT NULL DEFAULT 'Personal',
  broker      VARCHAR(255)  DEFAULT NULL,
  initial_balance  DECIMAL(15,2) NOT NULL DEFAULT 0,
  current_balance  DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency    VARCHAR(10)   NOT NULL DEFAULT 'USD',
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ─── Account Transactions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS account_transactions (
  id          CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  account_id  CHAR(36)      NOT NULL,
  user_id     VARCHAR(100)  NOT NULL DEFAULT 'local',
  type        VARCHAR(20)   NOT NULL,          -- 'deposit' or 'withdrawal'
  amount      DECIMAL(15,2) NOT NULL,
  note        TEXT          DEFAULT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES trading_accounts(id) ON DELETE CASCADE,
  INDEX idx_account (account_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ─── Trades ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trades (
  id                  CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  user_id             VARCHAR(100)  NOT NULL DEFAULT 'local',
  account_id          CHAR(36)      NOT NULL,
  trade_id            VARCHAR(50)   NOT NULL,
  date                DATE          NOT NULL,
  session             VARCHAR(20)   NOT NULL,
  pair                VARCHAR(20)   NOT NULL,
  direction           VARCHAR(10)   NOT NULL,
  lot_size            DECIMAL(10,4) NOT NULL DEFAULT 0,
  entry_price         DECIMAL(15,5) NOT NULL DEFAULT 0,
  stop_loss           DECIMAL(15,5) NOT NULL DEFAULT 0,
  take_profit         DECIMAL(15,5) NOT NULL DEFAULT 0,
  exit_price          DECIMAL(15,5) DEFAULT NULL,
  risk_amount         DECIMAL(15,2) NOT NULL DEFAULT 0,
  risk_percent        DECIMAL(8,4)  NOT NULL DEFAULT 0,
  account_size        DECIMAL(15,2) NOT NULL DEFAULT 0,
  strategy            VARCHAR(100)  DEFAULT NULL,
  htf_timeframe       VARCHAR(10)   DEFAULT NULL,
  entry_timeframe     VARCHAR(10)   DEFAULT NULL,
  market_condition    VARCHAR(50)   DEFAULT NULL,
  confluences         JSON          DEFAULT NULL,
  screenshot_before   TEXT          DEFAULT NULL,
  screenshot_after    TEXT          DEFAULT NULL,
  notes               TEXT          DEFAULT NULL,
  status              VARCHAR(20)   NOT NULL DEFAULT 'Open',
  dealing_range_high  DECIMAL(15,5) DEFAULT NULL,
  dealing_range_low   DECIMAL(15,5) DEFAULT NULL,
  equilibrium         DECIMAL(15,5) DEFAULT NULL,
  trade_location      VARCHAR(20)   DEFAULT NULL,
  liquidity_sweep_type VARCHAR(50)  DEFAULT NULL,
  key_levels          JSON          DEFAULT NULL,
  entry_type          VARCHAR(100)  DEFAULT NULL,
  entry_quality       TINYINT       DEFAULT NULL,
  htf_bias_respected  TINYINT(1)    DEFAULT NULL,
  ltf_bos_confirmed   TINYINT(1)    DEFAULT NULL,
  mss_present         TINYINT(1)    DEFAULT NULL,
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES trading_accounts(id) ON DELETE CASCADE,
  INDEX idx_account (account_id),
  INDEX idx_user (user_id),
  INDEX idx_date (date),
  INDEX idx_pair (pair)
) ENGINE=InnoDB;
