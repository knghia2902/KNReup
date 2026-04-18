# Task: Expand Panels and Remove Icons

The user wants to widen the left and right panels of the Downloader UI and remove several decorative icons (platform icons, status dots, and button icons) from the history table to achieve a cleaner look.

## Proposed Changes

### [Layout Expansion]
- **downloader.css**: Adjust the main grid columns in `.dl-main-grid` to allow more width for the panels (reducing central empty space if any, or just increasing the container max-width).

### [Icon Removal]
- **DownloadHistory.tsx**:
    - Remove the platform icon from the `PLATFORM` column.
    - Remove the status dot from `StatusBadge`.
    - Remove the `🔄` icon from the "Khôi phục" button.
- **downloader.css**: Ensure spacing looks good after icon removal.

## Verification Plan
- Manual check in the browser to ensure panels are wider and icons are gone.
