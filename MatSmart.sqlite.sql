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
CREATE VIEW MostDiscounted AS
SELECT name, url, price, normalPrice, (100 - ((price / normalPrice) * 100)) AS Discount FROM Products ORDER BY Discount DESC;
CREATE VIEW CheapestProducts AS
SELECT * FROM Products ORDER BY price ASC;
COMMIT;
