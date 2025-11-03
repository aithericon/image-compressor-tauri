-- PRAGMAs (applied per-connection, handled in code as well)
-- PRAGMA foreign_keys=ON;
-- PRAGMA journal_mode=WAL;

-- accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  email_address TEXT NOT NULL,
  username TEXT,
  provider TEXT,
  imap_host TEXT NOT NULL,
  imap_port INTEGER NOT NULL,
  imap_secure INTEGER NOT NULL DEFAULT 1,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_secure INTEGER NOT NULL DEFAULT 1,
  auth_kind TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- mailboxes
CREATE TABLE IF NOT EXISTS mailboxes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  special_use TEXT,
  uid_validity INTEGER,
  highest_modseq INTEGER,
  last_sync_at INTEGER,
  UNIQUE(account_id, path)
);

-- messages
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  mailbox_id INTEGER NOT NULL REFERENCES mailboxes(id) ON DELETE CASCADE,
  uid INTEGER NOT NULL,
  msg_id TEXT,
  subject TEXT,
  from_ TEXT,
  to_ TEXT,
  cc TEXT,
  bcc TEXT,
  date INTEGER,
  snippet TEXT,
  size INTEGER,
  flags_seen INTEGER NOT NULL DEFAULT 0,
  flags_flagged INTEGER NOT NULL DEFAULT 0,
  flags_answered INTEGER NOT NULL DEFAULT 0,
  flags_deleted INTEGER NOT NULL DEFAULT 0,
  has_attachments INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(account_id, mailbox_id, uid)
);

-- message_bodies
CREATE TABLE IF NOT EXISTS message_bodies (
  message_id INTEGER PRIMARY KEY REFERENCES messages(id) ON DELETE CASCADE,
  body_text TEXT,
  body_html TEXT,
  raw_rfc822 BLOB
);

-- attachments
CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  filename TEXT,
  mime TEXT,
  size INTEGER,
  content_id TEXT,
  inline INTEGER NOT NULL DEFAULT 0,
  path TEXT NOT NULL,
  sha256 TEXT
);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id);

-- drafts
CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  to_ TEXT,
  cc TEXT,
  bcc TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  attachments_json TEXT,
  updated_at INTEGER NOT NULL
);

-- sync_state
CREATE TABLE IF NOT EXISTS sync_state (
  account_id TEXT NOT NULL,
  mailbox_id INTEGER NOT NULL,
  last_uid INTEGER,
  uid_validity INTEGER,
  last_full_sync_at INTEGER,
  PRIMARY KEY (account_id, mailbox_id)
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_messages_acc_mb_date ON messages(account_id, mailbox_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_messages_acc_mb_seen ON messages(account_id, mailbox_id, flags_seen);

