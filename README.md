# LibraryExtension
A Manga Library Chrome Extension developed by Catze


# DESIGN
--- 1. POPUP ---
* 1.1 Design
    * 1.1.1 Data Display
    * 1.1.2 Buttons for Redirect to library
        * 1.1.2.1 Manual Add
        * 1.1.2.2 Manual Edit
        * 1.1.2.3 Settings
        * 1.1.2.4 Manga itself
    * 1.1.3 Delete 



---
--- 2. LIBRARY VIEW ---
* 2.1 Library Display
    * 2.1.1 Navigation Bar
        * 2.1.1.1 Side Bar
            * 2.1.1.1.1 Data (Total Tracked, Total Chapters read)
            * 2.1.1.1.2 Config Options (Toggles)
                * Show ReadingPage Features (Progress)
                * Show InfoPage Features (Add)
            * 2.1.1.1.3 Data Expor/Import Buttons
            * 2.1.1.1.4 Data Management (Tags) Button --> Redirect to /settings/tags
            * 2.1.1.1.5 Duplicates Search --> Redirect to /settings/duplicates
            * 2.1.1.1.6 Cover Cleanup Button
            * 2.1.1.1.7 Grid Size
            * 2.1.1.1.8 Accent Color
        * 2.1.1.2 Search
            * 2.1.1.2.1 By Title
            * 2.1.1.2.2 By Alt Title
        * 2.1.1.3 Filter
            * 2.1.1.3.1 Genre (Exclusions, Inclusions)
            * 2.1.1.3.2 SFW Rating (Only SFW, No SFW, All)
            * 2.1.1.3.3 Type (Manhwa, Manga, Manhua)
            * 2.1.1.3.4 Status 
            * 2.1.1.3.5 Website
            * 2.1.1.3.6 Timestamp (Updated)
            * 2.1.1.3.7 Date added
            * 2.1.1.3.8 Rating
            * 2.1.1.3.9 Release Year
            * 2.1.1.3.10 Chapter Progress
            * 2.1.1.3.11 Chapter Count
            * 2.1.1.3.12 Completion %
        * 2.1.1.4 Sort (asc, desc)
            * 2.1.1.4.1 Title
            * 2.1.1.4.2 Timestamp (Updated)
            * 2.1.1.4.3 Date added
            * 2.1.1.4.4 Rating
            * 2.1.1.4.5 Release Year
            * 2.1.1.4.6 Chapter Progress
            * 2.1.1.4.7 Chapter Count
            * 2.1.1.4.8 Completion %
    * 2.1.2 View
        * 2.1.2.1 Table
            * 2.1.2.1.1 Columns (non clickable)
                * 2.1.2.1.1.1 ID
                * 2.1.2.1.1.2 Cover
                * 2.1.2.1.1.3 Title (Editable by click --> Text)
                * 2.1.2.1.1.4 Alt Titles (Editable by click --> Text)
                * 2.1.2.1.1.5 Type (Editable by click --> Choosing)
                * 2.1.2.1.1.6 Status (Editable by click --> Choosing)
                * 2.1.2.1.1.7 Reading Progress (Editable by click --> Number, Increment/Decrement)
                * 2.1.2.1.1.8 Chapter Count (Editable by click --> Number, Increment/Decrement)
                * 2.1.2.1.1.9 Genres (Editable by click --> Choosing by searching)
                * 2.1.2.1.1.10 Links 
        * 2.1.2.2 Grid
            * 2.1.2.2.1 each Card (click --> Redirect to /manga/{id})
                * 2.1.2.2.1.1 Selection
                * 2.1.2.2.1.2 Cover (<> Buttons) 
                * 2.1.2.2.1.3 Type
                * 2.1.2.2.1.4 Status
                * 2.1.2.2.1.5 Links
                * 2.1.2.2.1.6 SFW Rating
                * 2.1.2.2.1.7 Title
                * 2.1.2.2.1.8 Progress / Chapter Count
                * 2.1.2.2.1.9 Genres
                * 2.1.2.2.1.10 Update Data Button
        * 2.1.2.3 List (click on Title or Cover Image --> Redirect to /manga/{id})
            * 2.1.2.3.1 each Row
                * 2.1.2.3.1.1 Cover
                * 2.1.2.3.1.2 Title
                * 2.1.2.3.1.3 Alt Titles
                * 2.1.2.3.1.4 Author
                * 2.1.2.3.1.5 Artist
                * 2.1.2.3.1.6 Genres
                * 2.1.2.3.1.7 Description
                * 2.1.2.3.1.8 Progress
                * 2.1.2.3.1.9 Latest Chapter
                * 2.1.2.3.1.10 Rating
                * 2.1.2.3.1.11 SFW Rating
                * 2.1.2.3.1.12 Status
                * 2.1.2.3.1.13 Link


* 2.2 Detail View for each Entry


* 2.3 Settings / Config 
    * 2.3.1 Data (Total Tracked, Total Chapters read)
    * 2.3.2 Config Options (Toggles)
        * Show ReadingPage Features (Progress)
        * Show InfoPage Features (Add)
    * 2.3.3 Data Expor/Import Buttons
    * 2.3.4 Data Management (Tags) Button --> Redirect to /settings/tags
    * 2.3.5 Duplicates Search --> Redirect to /settings/duplicates
    * 2.3.6 Config --> Redirect to /settings/config
    * 2.3.7 Cover Cleanup Button
    * 2.3.8 Grid Size
    * 2.3.9 Accent Color

---
--- 3. BACKEND --- 
* 3.1 Logging
* 3.2 Data Extraction
* 3.3 Data Manipulation
* 3.4 Requests


--- 
--- 4. CONFIG ---
* 4.1 DB
    * 4.1.1 Filename: catzeLibraryExtension.sqlite
    * 4.1.2 Tables
        * 4.1.2.1 bookmarks
            * 4.1.2.1.1 id 
                * 4.1.2.1.1.1 dataType --> INTEGER PRIMARY KEY AUTOINCREMENT
                * 4.1.2.1.1.2 example --> 2
            * 4.1.2.1.2 current_ch 
                * 4.1.2.1.2.1 dataType --> TEXT NOT NULL
                * 4.1.2.1.2.2 example --> "36.0"
            * 4.1.2.1.3 title
                * 4.1.2.1.3.1 dataType --> TEXT NOT NULL
                * 4.1.2.1.3.2 example --> "The wandering Swordsman"
            * 4.1.2.1.4 alt_titles
                * 4.1.2.1.4.1 dataType --> TEXT
                * 4.1.2.1.4.2 example --> "["The lone Swordsman", "The mighty Swordmaster"]"
            * 4.1.2.1.5 cover_img_id
                * 4.1.2.1.5.1 dataType --> TEXT
                * 4.1.2.1.5.2 example --> "afc540d4-eefc-46a0-8600-7924a5082d92"
            * 4.1.2.1.6 latest_ch
                * 4.1.2.1.6.1 dataType --> TEXT DEFAULT '0'
                * 4.1.2.1.6.2 example --> "300" or "oneshot"
            * 4.1.2.1.7 latest_ch_update_date
                * 4.1.2.1.7.1 dataType --> DATE
                * 4.1.2.1.7.2 example --> 2026-03-26
            * 4.1.2.1.8 rating
                * 4.1.2.1.8.1 dataType --> TEXT
                * 4.1.2.1.8.2 example --> "9.3"
            * 4.1.2.1.9 release_year
                * 4.1.2.1.9.1 dataType --> INTEGER
                * 4.1.2.1.9.2 example --> 2017
            * 4.1.2.1.10 status
                * 4.1.2.1.10.1 dataType --> TEXT
                * 4.1.2.1.10.2 example --> "Ongoing"
            * 4.1.2.1.12 description
                * 4.1.2.1.12.1 dataType --> TEXT
                * 4.1.2.1.12.2 example --> "After a long day, he passed away."
            * 4.1.2.1.13 nsfw
                * 4.1.2.1.13.1 dataType --> INTEGER DEFAULT 0
                * 4.1.2.1.13.2 example --> 0 or 1
            * 4.1.2.1.14 timestamp
                * 4.1.2.1.14.1 dataType --> DATETIME DEFAULT (datetime('now', 'localtime'))
                * 4.1.2.1.14.2 example --> 2026-06-18 14:25:24
        * 4.1.2.2 urls
            * 4.1.2.2.1 id 
                * 4.1.2.2.1.1 dataType --> INTEGER PRIMARY KEY AUTOINCREMENT
                * 4.1.2.2.1.2 example --> 2 
            * 4.1.2.2.2 bookmark_id 
                * 4.1.2.2.2.1 dataType --> INTEGER NOT NULL
                * 4.1.2.2.2.2 example --> 2
            * 4.1.2.2.3 url
                * 4.1.2.2.3.1 dataType --> TEXT UNIQUE NOT NULL
                * 4.1.2.2.3.2 example --> "https://asurascans.com/comics/nano-machine/"
            * 4.1.2.2.4 website_id
                * 4.1.2.2.4.1 dataType --> INTEGER NOT NULL
                * 4.1.2.2.4.2 example --> 2
            * 4.1.2.2.5 FOREIGN_KEY(bookmark_id)
                * 4.1.2.2.5.1 dataType --> REFERENCES bookmarks(id)
            * 4.1.2.2.5 FOREIGN_KEY(website_id)
                * 4.1.2.2.5.1 dataType --> REFERENCES tags(id)
        * 4.1.2.3 tags
            * 4.1.2.3.1 id 
                * 4.1.2.3.1.1 dataType --> INTEGER PRIMARY KEY AUTOINCREMENT
                * 4.1.2.3.1.2 example --> 2 
            * 4.1.2.3.2 name 
                * 4.1.2.3.2.1 dataType --> TEXT UNIQUE NOT NULL
                * 4.1.2.3.2.2 example --> "Fantasy" or "AsuraScans"
            * 4.1.2.3.3 type
                * 4.1.2.3.3.1 dataType --> TEXT NOT NULL
                * 4.1.2.3.3.2 example --> "Genre" or "Website" or "Artist" or "Author" 
            * 4.1.2.3.4 extra_data
                * 4.1.2.3.4.1 dataType --> TEXT
                * 4.1.2.3.4.2 example --> e.g. "["url": "asurascans.com"] in case of Type="Website"
        * 4.1.2.4 tag_aliases
            * 4.1.2.4.1 id 
                * 4.1.2.4.1.1 dataType --> INTEGER PRIMARY KEY AUTOINCREMENT
                * 4.1.2.4.1.2 example --> 2 
            * 4.1.2.4.2 tag_id 
                * 4.1.2.4.2.1 dataType --> INTEGER NOT NULL
                * 4.1.2.4.2.2 example --> 2 
            * 4.1.2.4.3 alias
                * 4.1.2.4.3.1 dataType --> TEXT NOT NULL
                * 4.1.2.4.3.2 example --> 2 
            * 4.1.2.4.4 extra_data
                * 4.1.2.4.4.1 dataType --> TEXT
                * 4.1.2.4.4.2 example --> e.g. "["url": "asurascans.com"] in case of Type="Website"
            * 4.1.2.4.5 FOREIGN_KEY(tag_id)
                * 4.1.2.4.5.1 dataType --> REFERENCES tags(id)
        * 4.1.2.5 update_queue
            * 4.1.2.5.1 id 
                * 4.1.2.5.1.1 dataType --> INTEGER PRIMARY KEY AUTOINCREMENT
                * 4.1.2.5.1.2 example --> 2 
            * 4.1.2.5.2 bookmark_id 
                * 4.1.2.5.2.1 dataType --> INTEGER NOT NULL
                * 4.1.2.5.2.2 example --> 2
            * 4.1.2.5.3 proposed_data
                * 4.1.2.5.3.1 dataType --> TEXT 
                * 4.1.2.5.3.2 example --> 
            * 4.1.2.5.4 full_entry
                * 4.1.2.5.4.1 dataType --> TEXT 
                * 4.1.2.5.4.2 example -->
            * 4.1.2.5.5 source_url
                * 4.1.2.5.5.1 dataType --> TEXT 
                * 4.1.2.5.5.2 example -->
            * 4.1.2.5.6 timestamp
                * 4.1.2.5.6.1 dataType --> DATETIME DEFAULT (datetime('now', 'localtime'))
                * 4.1.2.5.6.2 example --> 2026-06-18 14:25:24
            * 4.1.2.5.7 FOREIGN_KEY(bookmark_id)
                * 4.1.2.5.7.1 dataType --> REFERENCES bookmarks(id)
        * 4.1.2.6 logs
            * 4.1.2.6.1 id 
                * 4.1.2.6.1.1 dataType --> INTEGER PRIMARY KEY AUTOINCREMENT
                * 4.1.2.6.1.2 example --> 2 
            * 4.1.2.6.2 action
                * 4.1.2.6.2.1 dataType --> TEXT NOT NULL
                * 4.1.2.6.2.2 example --> "Progress Sync" 
            * 4.1.2.6.3 source
                * 4.1.2.6.3.1 dataType --> TEXT 
                * 4.1.2.6.3.2 example --> 
            * 4.1.2.6.4 data
                * 4.1.2.6.4.1 dataType --> TEXT 
                * 4.1.2.6.4.2 example --> 
            * 4.1.2.6.5 details
                * 4.1.2.6.5.1 dataType --> TEXT 
                * 4.1.2.6.5.2 example --> 
            * 4.1.2.6.6 timestamp
                * 4.1.2.6.6.1 dataType --> DATETIME DEFAULT (datetime('now', 'localtime'))
                * 4.1.2.6.6.2 example --> 2026-06-18 14:25:24
        * 4.1.2.7 bookmark_tags
            * 4.1.2.7.1 bookmark_id 
                * 4.1.2.7.1.1 dataType --> PRIMARY KEY INTEGER NOT NULL
                * 4.1.2.7.1.2 example --> 2
            * 4.1.2.7.2 tag_id 
                * 4.1.2.7.2.1 dataType --> PRIMARY KEY INTEGER NOT NULL
                * 4.1.2.7.2.2 example --> 2
            * 4.1.2.7.3 FOREIGN_KEY(bookmark_id)
                * 4.1.2.7.3.1 dataType --> REFERENCES bookmarks(id) ON DELETE CASCADE
            * 4.1.2.7.3 FOREIGN_KEY(tag_id)
                * 4.1.2.7.3.1 dataType --> REFERENCES tags(id) ON DELETE CASCADE


* 4.2 WebsiteData
    * 4.2.1 {website_url}
        * 4.2.1.1 name --> "AsuraScans"
        * 4.2.1.2 urlBase --> "https://asurascans.com/comics/"
        * 4.2.1.3 selectors
            * 4.2.1.3.1 ReadingPage
                * 4.2.1.3.1.1 MangaUrl
                    * 4.2.1.3.1.1.1 queryType --> "css" or "xpath"
                    * 4.2.1.3.1.1.2 query 
                ...
            * 4.2.1.3.2 InfoPage
                * 4.2.1.3.2.1 any column --> e.g. "title"
                    * 4.2.1.3.2.1.1 queryType --> "css" or "xpath"
                    * 4.2.1.3.2.1.2 query
                    * 4.2.1.3.2.1.3 type --> e.g. "img" or "text"
                    * 4.2.1.3.2.1.4 extraSettings
                        * 4.2.1.3.2.1.4.1 take_firstMatch --> true or false
                        * 4.2.1.3.2.1.4.2 split_by --> e.g. ","
                ...
        * 4.2.1.4 contentFilters
            * 4.2.1.4.1 some column
                * 4.2.1.4.1.1 elementFilter --> e.g. ["label", "a"]
                * 4.2.1.4.1.2 contentFilter --> e.g. [",", "released"]
        * 4.2.1.5 siteStructure
            * 4.2.1.5.1 infoPage --> e.g. "^https://asurascans\\.com/comics/[^/]+/?$"
            * 4.2.1.5.2 readingPage --> e.g. "^https://asurascans\\.com/comics/[^/]+/chapter/\\d+/?$"
* 4.3 settings
    * 4.3.1 port
    * 4.3.2 insertionsSettings
        * 4.3.2.1 enableReadingPageFeatures --> true or false
        * 4.3.2.2 enableInfoPageFeatures --> true or false
    * 4.3.3 dataValidationSettings
        * 4.3.3.1 manualVerification --> e.g. ["cover_img", "title"]
        * 4.3.3.2 autoUpdate --> e.g. ["latest_ch", "rating"]

---
--- 5. FILE TREE ---
* 5.1 backend Folder
    * 5.1.1 covers Folder
        * 5.1.1.1 {manga_id} Folder
            * 5.1.1.1.1 a Manga Cover (!ref: 4.1.2.1.1.5) --> 1df38822-5a45-447f-9a79-8e30e5fbf59a.jpg
    * 5.1.2 favicons Folder
        * 5.1.2.1 a Website Favicon 
* 5.2 frontend