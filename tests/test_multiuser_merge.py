"""End-to-end multi-user merge tests.

These run the REAL sync_account()/run() flows against a fake Substack world,
proving that members on different accounts (and tiers) adding their own
cookies merge cleanly: no duplicate articles or episodes, locked previews get
upgraded by paying members, metadata gaps get filled, every contributor gets
credited, and a post seen by N accounts produces ONE digest item.
"""
import types

import pytest

from app import db
from app.ingest import substack

# paywall marker = "this body is the FULL text" (see substack._is_locked)
FULL = '<div class="paywall-jump"></div><p>the full body text</p>'
PREVIEW = "<p>just the teaser paragraph</p>"

X = "https://blogx.substack.com"
Y = "https://blogy.example.com"        # custom domain
Z_SUB, Z_CUSTOM = "https://blogz.substack.com", "https://z.dev"


class World:
    """Fake Substack: publications, posts, and per-cookie access levels."""

    def __init__(self):
        self.posts = {
            X: [
                dict(id=1, slug="free-post", title="Free Post", type="newsletter",
                     audience="everyone", canonical_url=f"{X}/p/free-post",
                     post_date="2026-01-01T00:00:00", cover_image="https://cdn/x1.png"),
                dict(id=2, slug="paid-post", title="Paid Post", type="newsletter",
                     audience="only_paid", canonical_url=f"{X}/p/paid-post",
                     post_date="2026-01-02T00:00:00", cover_image="https://cdn/x2.png"),
                dict(id=3, slug="paid-pod", title="Paid Pod", type="podcast",
                     audience="only_paid", canonical_url=f"{X}/p/paid-pod",
                     post_date="2026-01-03T00:00:00"),
            ],
            Y: [
                dict(id=4, slug="y-post", title="Y Post", type="newsletter",
                     audience="only_paid", canonical_url=f"{Y}/p/y-post",
                     post_date="2026-01-04T00:00:00"),
            ],
            # NO canonical_url on Z's post, and the two members discover the pub
            # under DIFFERENT bases -> merge must fall back to (pub, title)
            Z_SUB: [dict(id=5, slug="z-post", title="Z Post", type="newsletter",
                         audience="everyone", post_date="2026-01-05T00:00:00")],
            Z_CUSTOM: [dict(id=5, slug="z-post", title="Z Post", type="newsletter",
                            audience="everyone", post_date="2026-01-05T00:00:00")],
        }
        self.accounts = {}   # cookie -> {"pubs": [(name, base)], "paid": {base, ...}}
        self.downloads = []
        self.pushed = []

    # ---- API fakes, keyed off the session's cookie ----
    def get_publications(self, s):
        paid = self.accounts[s.cookie]["paid"]
        return [{"name": n, "base_url": b, "paid": b in paid}
                for n, b in self.accounts[s.cookie]["pubs"]]

    def fetch_archive(self, s, base, n):
        return list(self.posts.get(base, []))

    def post_by_id(self, s, post_id):
        acct = self.accounts[s.cookie]
        post = next((p for posts in self.posts.values() for p in posts
                     if p["id"] == post_id), None)
        if post is None:
            return None
        paid_ok = any(post in self.posts.get(b, []) for b in acct["paid"])
        full = dict(post)
        if post["audience"] == "only_paid" and not paid_ok:
            full["body_html"] = PREVIEW          # teaser only
            full["hidden"] = True                # Substack marks withheld bodies -> locked
            if post["type"] == "podcast":
                # a paid show still hands a non-subscriber a short PREVIEW clip
                full["podcast_url"] = f"https://media.test/{post['slug']}-preview.mp3"
                full["podcast_duration"] = 60
            else:
                full.pop("podcast_url", None)
        else:
            full["body_html"] = FULL
            full["hidden"] = False               # full access -> body not hidden
            if post["type"] == "podcast":
                full["podcast_url"] = f"https://media.test/{post['slug']}.mp3"
                full["podcast_duration"] = 1800
        return full

    def download(self, url, key, headers=None):
        self.downloads.append(key)
        return 999, "audio/mpeg"


@pytest.fixture
def world(fresh_db, monkeypatch):
    w = World()
    monkeypatch.setattr(substack, "_session",
                        lambda cookie: types.SimpleNamespace(
                            cookie=cookie, headers={"User-Agent": "test"}))
    monkeypatch.setattr(substack, "get_publications", w.get_publications)
    monkeypatch.setattr(substack, "fetch_archive", w.fetch_archive)
    monkeypatch.setattr(substack, "_post_by_id", w.post_by_id)
    monkeypatch.setattr(substack, "_download_to_storage", w.download)
    monkeypatch.setattr(substack, "_self_handle", lambda s: None)
    monkeypatch.setattr(substack, "get_publications_via_profile", lambda s, h: [])
    monkeypatch.setattr(substack.time, "sleep", lambda *_: None)
    monkeypatch.setattr(substack.notify, "push_new_items",
                        lambda items: w.pushed.append(items))
    return w


def _member(w, name, cookie, pubs, paid):
    uid = db.create_user(name, "hash")
    db.add_account(uid, "substack", f"{name}'s account", cookie)
    w.accounts[cookie] = {"pubs": pubs, "paid": set(paid)}
    return _account_row(f"{name}'s account")


def _account_row(label):
    return next(a for a in db.list_accounts() if a["label"] == label)


# ---------------------------------------------------------------- scenarios

def test_free_then_paid_upgrades_without_duplicates(world):
    _member(world, "alice", "c1", [("Blog X", X), ("Blog Z", Z_SUB)], paid=[])
    _member(world, "bob", "c2",
            [("Blog X", X), ("Blog Y", Y), ("Blog Z", Z_CUSTOM)], paid=[X, Y])

    substack.sync_account(_account_row("alice's account"))
    paid = db.find_article_match(f"{X}/p/paid-post")
    assert paid["is_locked"] == 1 and "teaser" in paid["html"]

    substack.sync_account(_account_row("bob's account"))

    arts = db.list_articles()
    assert sorted(a["title"] for a in arts) == ["Free Post", "Paid Post", "Y Post", "Z Post"]
    paid = db.get_article(paid["id"])
    assert paid["is_locked"] == 0 and "full body" in paid["html"]   # upgraded in place
    for title in ("Free Post", "Paid Post", "Z Post"):
        row = next(a for a in arts if a["title"] == title)
        srcs = db.list_article_sources(row["id"])
        assert {"alice's account", "bob's account"} <= set(srcs), (title, srcs)


def test_paid_first_free_second_never_downgrades(world):
    _member(world, "alice", "c1", [("Blog X", X)], paid=[])
    _member(world, "bob", "c2", [("Blog X", X)], paid=[X])

    substack.sync_account(_account_row("bob's account"))
    paid = db.find_article_match(f"{X}/p/paid-post")
    assert paid["is_locked"] == 0 and "full body" in paid["html"]

    substack.sync_account(_account_row("alice's account"))
    after = db.get_article(paid["id"])
    assert after["html"] == paid["html"] and after["is_locked"] == 0
    assert len(db.list_articles()) == 2  # Free + Paid (the pod is an episode)
    assert "alice's account" in db.list_article_sources(paid["id"])


def test_cross_base_merge_without_canonical_url(world):
    """Same post, no canonical_url, discovered under different bases."""
    _member(world, "alice", "c1", [("Blog Z", Z_SUB)], paid=[])
    _member(world, "bob", "c2", [("Blog Z", Z_CUSTOM)], paid=[])
    substack.sync_account(_account_row("alice's account"))
    substack.sync_account(_account_row("bob's account"))
    rows = [a for a in db.list_articles() if a["title"] == "Z Post"]
    assert len(rows) == 1
    assert {"alice's account", "bob's account"} <= set(db.list_article_sources(rows[0]["id"]))


def test_email_row_absorbed_by_cookie_sync(world):
    aid = db.insert_article(
        message_id="<email-123@substack.com>", publication="Blog X",
        title="Paid Post", author=None, html='<p class="stub">link only</p>',
        original_url=f"http://blogx.substack.com/p/paid-post?utm_source=email",
        published_at=None)
    _member(world, "bob", "c2", [("Blog X", X)], paid=[X])
    substack.sync_account(_account_row("bob's account"))

    rows = [a for a in db.list_articles() if a["title"] == "Paid Post"]
    assert len(rows) == 1 and rows[0]["id"] == aid
    row = db.get_article(aid)
    assert row["message_id"] == "substack:2"          # canonical id adopted
    assert "full body" in row["html"] and row["is_locked"] == 0
    assert row["cover_image"] == "https://cdn/x2.png"  # metadata filled in


def test_paid_subscriber_upgrades_preview_podcast(world):
    """A free subscriber stores the short PREVIEW clip; a paying subscriber's sync
    replaces it with the full episode in place (same guid), no duplicate. Audio
    access tracks paid SUBSCRIPTION status, not the post text paywall."""
    _member(world, "alice", "c1", [("Blog X", X)], paid=[])      # free sub
    _member(world, "bob", "c2", [("Blog X", X)], paid=[X])       # paid sub

    substack.sync_account(_account_row("alice's account"))
    assert len(db.list_episodes()) == 1 and len(world.downloads) == 1   # preview stored
    assert db.get_episode_by_guid("substack:3")["paid_access"] == 0
    # the paid show is flagged paid in the feed filter (green chip) regardless
    assert {f["feed_name"]: f["paid"] for f in db.list_episode_feeds()}["Blog X"] == 1

    substack.sync_account(_account_row("bob's account"))
    ep = db.get_episode_by_guid("substack:3")
    assert ep["paid_access"] == 1                      # upgraded to full audio
    assert len(db.list_episodes()) == 1                # replaced in place, not duplicated
    assert len(world.downloads) == 2                   # preview + full, once each

    # resyncs are no-ops: it's full now, and a free member can't improve it
    substack.sync_account(_account_row("bob's account"))
    substack.sync_account(_account_row("alice's account"))
    assert len(world.downloads) == 2 and len(db.list_episodes()) == 1


def test_new_post_seen_by_both_accounts_one_digest_item(world):
    _member(world, "alice", "c1", [("Blog X", X)], paid=[])
    _member(world, "bob", "c2", [("Blog X", X)], paid=[X])
    substack.run()                       # backfill both (silent)
    backfill_pushes = [i for batch in world.pushed for i in batch]
    assert backfill_pushes == []         # backfills never notify

    world.posts[X].append(
        dict(id=9, slug="brand-new", title="Brand New", type="newsletter",
             audience="everyone", canonical_url=f"{X}/p/brand-new",
             post_date="2026-02-01T00:00:00"))
    world.pushed.clear()
    substack.run()

    rows = [a for a in db.list_articles() if a["title"] == "Brand New"]
    assert len(rows) == 1
    items = [i for batch in world.pushed for i in batch]
    assert len(items) == 1 and items[0]["title"] == "Brand New"   # ONE digest item
    assert {"alice's account", "bob's account"} <= set(db.list_article_sources(rows[0]["id"]))


def test_third_member_joining_later_changes_nothing(world):
    _member(world, "alice", "c1", [("Blog X", X)], paid=[])
    _member(world, "bob", "c2", [("Blog X", X)], paid=[X])
    substack.run()
    n_articles, n_episodes = len(db.list_articles()), len(db.list_episodes())
    n_downloads = len(world.downloads)

    _member(world, "carol", "c3", [("Blog X", X)], paid=[X])
    substack.sync_account(_account_row("carol's account"))
    assert len(db.list_articles()) == n_articles
    assert len(db.list_episodes()) == n_episodes
    assert len(world.downloads) == n_downloads     # audio not re-downloaded
    for a in db.list_articles():
        assert "carol's account" in db.list_article_sources(a["id"])


def test_recurring_titles_do_not_swallow_new_posts(world):
    """A pub that reuses titles ('Open Thread') must still get every post
    mirrored — the title fallback may never match a canonical substack row."""
    world.posts[X] = [
        dict(id=21, slug="open-thread-1", title="Open Thread", type="newsletter",
             audience="everyone", canonical_url=f"{X}/p/open-thread-1",
             post_date="2026-01-01T00:00:00"),
        dict(id=22, slug="open-thread-2", title="Open Thread", type="newsletter",
             audience="everyone", canonical_url=f"{X}/p/open-thread-2",
             post_date="2026-01-08T00:00:00"),
    ]
    _member(world, "alice", "c1", [("Blog X", X)], paid=[])
    substack.sync_account(_account_row("alice's account"))
    rows = [a for a in db.list_articles() if a["title"] == "Open Thread"]
    assert len(rows) == 2                       # both mirrored, nothing absorbed

    # but a non-canonical (email) row with a recurring title IS still mergeable
    aid = db.insert_article(message_id="<mail-9@x>", publication="Blog X",
                            title="Open Thread", author=None, original_url=None,
                            html="<p>email copy</p>", published_at=None)
    m = db.find_article_match(publication="Blog X", title="Open Thread")
    assert m and m["id"] == aid


def test_payer_priority_new_post_lands_full_via_verified_payer(world):
    """bob PAYS for Blog X but his discovery never sees it (private reading
    list, no pubs); verify_paid_access has stamped paid_json. alice (free)
    discovers the post first — her sync must pull the body with bob's cookie
    and store it unlocked immediately, credited to bob."""
    alice = _member(world, "alice", "c1", [("Blog X", X)], paid=[])
    bob = _member(world, "bob", "c2", [], paid=[X])
    db.set_account_paid_verified(bob["id"], ["Blog X"])

    substack.sync_account(alice)
    art = db.find_article_match(f"{X}/p/paid-post")
    assert art["is_locked"] == 0 and "full body" in art["html"]
    assert art["added_by"] == "bob's account"          # the payer supplied the body
    assert {"alice's account", "bob's account"} <= set(db.list_article_sources(art["id"]))


def test_payer_priority_upgrades_existing_locked_row(world):
    """A locked preview stored BEFORE verification exists gets upgraded by the
    next sync of ANY account once a payer is verified."""
    alice = _member(world, "alice", "c1", [("Blog X", X)], paid=[])
    bob = _member(world, "bob", "c2", [], paid=[X])

    substack.sync_account(alice)                       # nobody verified yet
    art = db.find_article_match(f"{X}/p/paid-post")
    assert art["is_locked"] == 1 and "teaser" in art["html"]

    db.set_account_paid_verified(bob["id"], ["Blog X"])
    substack.sync_account(alice)                       # alice again, not bob
    art = db.get_article(art["id"])
    assert art["is_locked"] == 0 and "full body" in art["html"]
    assert "bob's account" in db.list_article_sources(art["id"])


def test_payer_priority_downloads_full_podcast_audio(world):
    """A paid episode first seen by a free member downloads the FULL audio via
    the verified payer's cookie (paid_access=1), not the preview clip."""
    alice = _member(world, "alice", "c1", [("Blog X", X)], paid=[])
    bob = _member(world, "bob", "c2", [], paid=[X])
    db.set_account_paid_verified(bob["id"], ["Blog X"])

    substack.sync_account(alice)
    ep = db.get_episode_by_guid("substack:3")
    assert ep["paid_access"] == 1
    assert world.downloads == ["podcasts/blog-x/paid-pod.mp3"]   # full, once
    assert "-preview" not in world.downloads[0]

    # resync is a no-op: it's already full
    substack.sync_account(alice)
    assert len(world.downloads) == 1
