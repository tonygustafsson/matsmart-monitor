# MatSmart Monitor

Using NodeJS to scrap matsmart.se and send facebook messages to certain users when prices change.

You can also ignore the mail part and just show the SQLite views CheapestProducts and MostDiscounted.

## Usage guide

1. Create SQLite database by importing ./MatSmart.sqlite.sql in [SQLite Database Browser](https://portableapps.com/apps/development/sqlite_database_browser_portable)
2. Add your SMTP settings in mailSettings.json
3. Run "npm install"
4. Run "npm start"
