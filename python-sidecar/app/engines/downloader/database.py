"""
SQLite database layer for download tracking.
WAL mode for concurrent read/write. Async via aiosqlite.
"""
import aiosqlite
import os
import json
from datetime import datetime
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'downloads.db')


async def get_db() -> aiosqlite.Connection:
    """Get async SQLite connection with timeout."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    db = await aiosqlite.connect(DB_PATH, timeout=30)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    """Initialize downloads table and indexes using synchronous sqlite3 to prevent lifespan locks."""
    import sqlite3
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30)
    try:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS downloads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                platform TEXT NOT NULL,
                video_id TEXT,
                title TEXT,
                uploader TEXT,
                duration INTEGER,
                thumbnail_url TEXT,
                file_path TEXT,
                file_size INTEGER,
                resolution TEXT,
                format_id TEXT,
                status TEXT DEFAULT 'pending',
                progress REAL DEFAULT 0,
                speed TEXT,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                metadata TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
            CREATE INDEX IF NOT EXISTS idx_downloads_platform ON downloads(platform);
            DROP INDEX IF EXISTS idx_downloads_url;
            CREATE INDEX IF NOT EXISTS idx_downloads_url ON downloads(url);
        ''')
        # Migration: add project_id column if not present
        existing_cols = [row[1] for row in conn.execute('PRAGMA table_info(downloads)').fetchall()]
        if 'project_id' not in existing_cols:
            conn.execute('ALTER TABLE downloads ADD COLUMN project_id TEXT')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_downloads_project ON downloads(project_id)')
        conn.commit()
    finally:
        conn.close()


async def add_download(
    url: str,
    platform: str,
    title: str = "",
    uploader: str = "",
    duration: int = 0,
    thumbnail_url: str = "",
    video_id: str = "",
    format_id: str = "",
    resolution: str = "",
    metadata: Optional[dict] = None,
    project_id: Optional[str] = None,
) -> int:
    """Add a new download record. Returns download ID."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO downloads 
               (url, platform, title, uploader, duration, thumbnail_url, video_id, format_id, resolution, metadata, project_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (url, platform, title, uploader, duration, thumbnail_url,
             video_id, format_id, resolution, json.dumps(metadata) if metadata else None, project_id)
        )
        await db.commit()
        return cursor.lastrowid
    finally:
        await db.close()


async def update_download(download_id: int, **kwargs):
    """Update download record fields."""
    if not kwargs:
        return
    
    # Handle metadata serialization
    if 'metadata' in kwargs and isinstance(kwargs['metadata'], dict):
        kwargs['metadata'] = json.dumps(kwargs['metadata'])
    
    fields = ', '.join(f'{k} = ?' for k in kwargs.keys())
    values = list(kwargs.values())
    values.append(download_id)
    
    db = await get_db()
    try:
        await db.execute(
            f"UPDATE downloads SET {fields} WHERE id = ?",
            values
        )
        await db.commit()
    finally:
        await db.close()


async def get_download(download_id: int) -> Optional[dict]:
    """Get single download by ID."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM downloads WHERE id = ?", (download_id,)
        )
        row = await cursor.fetchone()
        if row:
            return dict(row)
        return None
    finally:
        await db.close()


async def list_downloads(
    limit: int = 50,
    offset: int = 0,
    platform: Optional[str] = None,
    status: Optional[str] = None,
    project_id: Optional[str] = None,
) -> list[dict]:
    """List downloads with optional filters."""
    db = await get_db()
    try:
        query = "SELECT * FROM downloads"
        params = []
        conditions = []
        
        if platform and platform != 'all':
            conditions.append("platform = ?")
            params.append(platform)
        if status:
            conditions.append("status = ?")
            params.append(status)
        if project_id:
            conditions.append("project_id = ?")
            params.append(project_id)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


async def delete_download(download_id: int) -> bool:
    """Delete download record. Returns True if deleted."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "DELETE FROM downloads WHERE id = ?", (download_id,)
        )
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


async def find_existing_download(url: str, video_id: str = "") -> Optional[dict]:
    """Find existing download by URL or Video ID."""
    db = await get_db()
    try:
        if video_id:
            cursor = await db.execute(
                "SELECT * FROM downloads WHERE video_id = ? OR url = ? ORDER BY created_at DESC", 
                (video_id, url)
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM downloads WHERE url = ? ORDER BY created_at DESC", 
                (url,)
            )
            
        row = await cursor.fetchone()
        if row:
            return dict(row)
        return None
    finally:
        await db.close()
