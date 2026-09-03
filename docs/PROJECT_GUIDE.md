# Project Guide

## Overview
This project is a static personal website for Mahmoud Hawa. It is designed to be easy to maintain, update, and operate from either VS Code or PowerShell.

## Main folders
- `assets/`: site styling and scripts
- `media/`: personal media and resume files
- `docs/`: project planning and notes
- `lib/`: future reusable modules
- `hooks/`: future custom front-end hooks or UI logic
- `scripts/`: future scripts for automation or deployment

## Editing workflow
1. Update text in `index.html` for profile and career content.
2. Update styling in `assets/css/styles.css`.
3. Add optional interactivity in `assets/js/main.js`.
4. Keep media under `media/`.

## Local control
From PowerShell:

```powershell
cd "d:\AI\personal-website"
./start-site.ps1
./status-site.ps1
./open-site.ps1
./stop-site.ps1
```

## Notes
- This site is meant to remain lightweight and easy to host.
- Static deployment is currently the default approach.
- Any future complexity should be introduced intentionally and documented here.
