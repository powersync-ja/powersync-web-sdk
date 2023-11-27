---
'@journeyapps/powersync-sdk-web': patch
---

Added mock SSR implementation for sync stream client. 
Added better worker and multiple tabs support.
Added support for Android (without multiple tab support).
Fixed race conditions in Safari by disabling Shared web workers (multiple tab support).
