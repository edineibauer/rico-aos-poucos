"""Caminhos canônicos do projeto — fonte única de verdade."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent  # rico-aos-poucos/

# Dados do site
DATA = ROOT / "data"
FIIS_DIR = DATA / "fiis"
FIIS_LISTA = DATA / "fiis.json"
FIIS_RECOMENDADOS = DATA / "fiis-recomendados.json"
ARTIGOS_DIR = ROOT / "artigos"
ARTIGOS_META = DATA / "artigos.json"
SITEMAP = ROOT / "sitemap.xml"
SW = ROOT / "sw.js"

# Dados do pipeline (novos)
UNIVERSO = DATA / "fundosnet-universo.json"
MAPA = DATA / "fundosnet-mapa.json"
MAPA_OVERLAY = DATA / "fundosnet-mapa-overlay.json"
ORFAOS = DATA / "fundosnet-orfaos.json"
SEEN = DATA / "fundosnet-seen.json"
LOG_DIR = DATA / "fundosnet-log"
BACKUP_DIR = FIIS_DIR / ".backups"


def ensure_dirs() -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
