"""Conexao com MySQL local. Lê config de env (TRACKER_DB_*) ou usa defaults."""
from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Iterator

import pymysql
from pymysql.connections import Connection


CONFIG = {
    "host":     os.environ.get("TRACKER_DB_HOST", "localhost"),
    "port":     int(os.environ.get("TRACKER_DB_PORT", "3306")),
    "user":     os.environ.get("TRACKER_DB_USER", "root"),
    "password": os.environ.get("TRACKER_DB_PASS", ""),
    "database": os.environ.get("TRACKER_DB_NAME", "rico_aos_poucos"),
    "charset":  "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor,
    "autocommit": False,
    "connect_timeout": 5,
}


@contextmanager
def conn() -> Iterator[Connection]:
    c = pymysql.connect(**CONFIG)
    try:
        yield c
        c.commit()
    except Exception:
        c.rollback()
        raise
    finally:
        c.close()
