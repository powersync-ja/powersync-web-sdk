---
'@journeyapps/powersync-sdk-web': patch
---

Fixed watched queries not updating due to race condition when opening multiple WA-SQLite connections due to initiating multiple PowerSync instances simultaneously.
