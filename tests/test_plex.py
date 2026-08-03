"""Plex browse tab: normalization, soft-fail, and the art-proxy path guard."""
import pytest

from app import config, plex


class _Resp:
    def __init__(self, payload=None, status=200, content=b"", ctype="image/jpeg"):
        self._payload, self.status_code = payload, status
        self.content, self.headers = content, {"Content-Type": ctype}

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise plex.requests.RequestException("boom")


@pytest.fixture(autouse=True)
def plex_env(monkeypatch):
    monkeypatch.setattr(config, "PLEX_URL", "https://plex.test:32400")
    monkeypatch.setattr(config, "PLEX_TOKEN", "tok")
    monkeypatch.setattr(config, "PLEX_SERVER_ID", "machine123")
    plex._CACHE.clear()


def test_unconfigured_is_soft(monkeypatch):
    monkeypatch.setattr(config, "PLEX_TOKEN", "")
    assert not plex.configured()
    with pytest.raises(plex.PlexError):
        plex.libraries()


def test_401_explains_the_shared_server_case(monkeypatch):
    monkeypatch.setattr(plex.requests, "get", lambda *a, **k: _Resp(status=401))
    with pytest.raises(plex.PlexError, match="rejected the token"):
        plex.libraries()


def test_browse_normalizes_items_and_totals(monkeypatch):
    payload = {"MediaContainer": {"title2": "Movies", "totalSize": 91, "Metadata": [
        {"ratingKey": "5", "title": "A Film", "type": "movie", "year": 2001,
         "duration": 5_400_000, "thumb": "/library/metadata/5/thumb/1"}]}}
    monkeypatch.setattr(plex.requests, "get", lambda *a, **k: _Resp(payload))
    section, items, total = plex.browse("1")
    assert (section["title"], total) == ("Movies", 91)
    assert items[0]["title"] == "A Film" and items[0]["duration_min"] == 90


def test_web_url_deep_links_to_plex_app():
    url = plex.web_url("42")
    assert "machine123" in url and "%2Flibrary%2Fmetadata%2F42" in url


def test_stream_url_direct_plays_browser_native_codecs(monkeypatch):
    payload = {"MediaContainer": {"Metadata": [
        {"ratingKey": "9", "title": "Native", "type": "movie",
         "Media": [{"container": "mp4", "videoCodec": "h264", "audioCodec": "aac",
                    "Part": [{"key": "/library/parts/77/file.mp4"}]}]}]}}
    monkeypatch.setattr(plex.requests, "get", lambda *a, **k: _Resp(payload))
    url = plex.stream_url("9", session="s1")
    assert url.startswith("https://plex.test:32400/library/parts/77/file.mp4")
    assert "X-Plex-Token=tok" in url


def test_stream_url_transcodes_non_native_codecs(monkeypatch):
    payload = {"MediaContainer": {"Metadata": [
        {"ratingKey": "9", "title": "MKV", "type": "movie",
         "Media": [{"container": "mkv", "videoCodec": "hevc", "audioCodec": "dts",
                    "Part": [{"key": "/library/parts/78/file.mkv"}]}]}]}}
    monkeypatch.setattr(plex.requests, "get", lambda *a, **k: _Resp(payload))
    url = plex.stream_url("9", session="s1")
    assert "/video/:/transcode/universal/start.m3u8" in url
    assert "protocol=hls" in url and "session=s1" in url


def test_search_filters_to_library_types(monkeypatch):
    payload = {"MediaContainer": {"Metadata": [
        {"ratingKey": "1", "title": "A Movie", "type": "movie"},
        {"ratingKey": "2", "title": "Some Actor", "type": "person"},
        {"ratingKey": "3", "title": "An Episode", "type": "episode",
         "parentIndex": 2, "index": 5}]}}
    monkeypatch.setattr(plex.requests, "get", lambda *a, **k: _Resp(payload))
    items = plex.search("a")
    assert [i["title"] for i in items] == ["A Movie", "An Episode"]
    assert items[1]["sxe"] == "S02E05"


def test_art_proxy_rejects_paths_outside_library(client, monkeypatch):
    # the proxy must not become a general fetcher against the Plex host
    from app import auth, db
    uid = db.create_user("m", auth.hash_password("pw12345678"))
    client.post("/login", data={"username": "m", "password": "pw12345678"})
    assert client.get("/plex/art", params={"path": "/etc/passwd"}).status_code == 400
    assert client.get("/plex/art", params={"path": "/library/../secret"}).status_code == 400
    assert uid
