BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS `Products` (
	`id`	INTEGER PRIMARY KEY AUTOINCREMENT,
	`name`	TEXT,
	`url`	TEXT,
	`price`	REAL,
	`normalPrice`	REAL
);
CREATE INDEX IF NOT EXISTS `URLIndex` ON `Products` (
	`url`
);
COMMIT;
