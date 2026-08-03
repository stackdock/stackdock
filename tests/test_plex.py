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
def plex_env(fresh_db, monkeypatch):
    # fresh_db: _token() consults the plex_auth table on every call now
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


def test_401_triggers_login_refresh_and_retry(monkeypatch):
    # stale token -> plex.tv sign-in -> per-server accessToken stored -> retried OK
    monkeypatch.setattr(config, "PLEX_EMAIL", "m@x.test")
    monkeypatch.setattr(config, "PLEX_PASSWORD", "hunter2")
    monkeypatch.setattr(config, "PLEX_SERVER_ID", "machine123")
    calls = {"gets": []}

    def fake_get(url, **kw):
        calls["gets"].append(url)
        token = (kw.get("headers") or {}).get("X-Plex-Token")
        if "plex.tv/api/v2/resources" in url:
            return _Resp([{"clientIdentifier": "machine123", "accessToken": "fresh-tok"}])
        if token == "fresh-tok":
            return _Resp({"MediaContainer": {"Directory": [{"key": "1", "title": "Movies"}]}})
        return _Resp(status=401)

    def fake_post(url, **kw):
        assert "sign_in" in url
        assert kw["data"]["user[password]"] == "hunter2"
        return _Resp({"user": {"authToken": "acct-tok"}})

    monkeypatch.setattr(plex.requests, "get", fake_get)
    monkeypatch.setattr(plex.requests, "post", fake_post)
    libs = plex.libraries()
    assert libs[0]["title"] == "Movies"
    from app import db
    assert db.get_plex_token() == "fresh-tok"       # persisted for future requests
    # and a refresh that can't find the server fails without looping
    plex._CACHE.clear()
    db.set_plex_token("")
    monkeypatch.setattr(config, "PLEX_SERVER_ID", "other-machine")
    monkeypatch.setattr(config, "PLEX_TOKEN", "stale")
    with pytest.raises(plex.PlexError):
        plex.libraries()


def test_neighbors_finds_prev_next_within_season(monkeypatch):
    sibs = [{"key": str(k), "title": f"Ep {k}", "type": "episode", "sxe": f"S01E0{k}"}
            for k in (1, 2, 3)]
    monkeypatch.setattr(plex, "children", lambda k: ({"title": "Season 1"}, sibs))
    cur = {"type": "episode", "parent_key": "10", "key": "2"}
    prev_ep, next_ep = plex.neighbors(cur)
    assert prev_ep["key"] == "1" and next_ep["key"] == "3"
    first_prev, _ = plex.neighbors({"type": "episode", "parent_key": "10", "key": "1"})
    assert first_prev is None
    assert plex.neighbors({"type": "movie", "key": "5"}) == (None, None)


def test_art_proxy_rejects_paths_outside_library(client, monkeypatch):
    # the proxy must not become a general fetcher against the Plex host
    from app import auth, db
    uid = db.create_user("m", auth.hash_password("pw12345678"))
    client.post("/login", data={"username": "m", "password": "pw12345678"})
    assert client.get("/plex/art", params={"path": "/etc/passwd"}).status_code == 400
    assert client.get("/plex/art", params={"path": "/library/../secret"}).status_code == 400
    assert uid
