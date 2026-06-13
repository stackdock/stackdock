"""S3-compatible object storage (Cloudflare R2, Backblaze B2, AWS S3)."""
import boto3
from botocore.config import Config as BotoConfig

from . import config

_client = None


def client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=config.S3_ENDPOINT_URL,
            aws_access_key_id=config.S3_ACCESS_KEY_ID,
            aws_secret_access_key=config.S3_SECRET_ACCESS_KEY,
            config=BotoConfig(signature_version="s3v4", retries={"max_attempts": 3}),
            region_name="auto",
        )
    return _client


def upload_stream(fileobj, key: str, content_type: str) -> None:
    client().upload_fileobj(
        fileobj,
        config.S3_BUCKET,
        key,
        ExtraArgs={"ContentType": content_type},
    )


def url_for(key: str, download_name: str | None = None) -> str:
    """Return a URL a podcast app or browser can fetch the object from.

    With download_name, presigned URLs carry Content-Disposition: attachment so
    browsers SAVE the file instead of playing it (the HTML download attribute is
    ignored for cross-origin URLs, so this is the only reliable way)."""
    if config.S3_PUBLIC_BASE_URL:
        return f"{config.S3_PUBLIC_BASE_URL}/{key}"
    params = {"Bucket": config.S3_BUCKET, "Key": key}
    if download_name:
        safe = "".join(ch for ch in download_name if ch.isalnum() or ch in " ._-").strip() or "episode"
        params["ResponseContentDisposition"] = f'attachment; filename="{safe}"'
    return client().generate_presigned_url(
        "get_object", Params=params, ExpiresIn=config.PRESIGN_EXPIRY_SECONDS)


def open_stream(key: str):
    """(iterator, content_type, content_length) streaming the object — used by
    the same-origin /audio proxy so page JS can cache episodes for offline
    (cross-origin presigned URLs can't be fetch()ed from JS without CORS)."""
    obj = client().get_object(Bucket=config.S3_BUCKET, Key=key)
    body = obj["Body"]
    return (iter(lambda: body.read(256 * 1024), b""),
            obj.get("ContentType") or "application/octet-stream",
            obj.get("ContentLength"))
