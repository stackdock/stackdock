"""Auth primitives: password hashing, signed sessions, reset tokens."""
from app import auth


def test_password_hash_roundtrip():
    h = auth.hash_password("correct horse battery staple")
    assert h != "correct horse battery staple"  # never stored in clear
    assert auth.verify_password("correct horse battery staple", h)
    assert not auth.verify_password("wrong", h)


def test_verify_password_bad_hash_is_false():
    # a malformed hash must not raise, just fail closed
    assert auth.verify_password("anything", "not-a-bcrypt-hash") is False


def test_session_value_roundtrip():
    token = auth.make_session_value(42)
    assert auth.read_session_value(token) == 42


def test_session_value_tampered_rejected():
    token = auth.make_session_value(42)
    assert auth.read_session_value(token + "x") is None
    assert auth.read_session_value("garbage") is None


def test_reset_token_hash_is_deterministic_and_opaque():
    h1 = auth._hash_token("abc")
    h2 = auth._hash_token("abc")
    assert h1 == h2
    assert h1 != "abc"
    assert len(h1) == 64  # sha256 hex


def test_new_reset_link_then_redeem_once(user):
    link = auth.new_reset_link(user["id"])
    token = link.rsplit("/", 1)[-1]
    assert auth.redeem_reset_token(token) == user["id"]
    # one-time: second redemption fails
    assert auth.redeem_reset_token(token) is None


def test_ensure_admin_user_seeds_once(fresh_db):
    from app import db
    assert db.user_count() == 0
    auth.ensure_admin_user()
    assert db.user_count() == 1
    auth.ensure_admin_user()  # idempotent
    assert db.user_count() == 1
    admin = db.get_user_by_name("admin")
    assert admin["is_admin"]
