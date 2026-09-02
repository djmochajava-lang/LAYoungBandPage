#!/usr/bin/env python3
"""
capture-videos.py — pull the band's YouTube performance videos into our own
asset inventory so sharing never depends on a YouTube link staying up.

Run from the repo root on the Mac mini / home server (needs network access
to YouTube — the cloud sandbox is blocked):

    brew install yt-dlp ffmpeg          # once
    python3 tools/capture-videos.py     # downloads + updates Video/manifest.json
    python3 tools/capture-videos.py --dry-run   # metadata only, no downloads

What it does for each entry in Video/manifest.json:
  1. Reads title / duration / upload date from YouTube (yt-dlp).
  2. Downloads the best MP4 (<=1080p, H.264 + AAC) to Video/live/<slug>.mp4
     — this folder is gitignored; it is the archival master + upload source.
  3. Saves a poster frame to images/video/<slug>-poster.jpg (committed).
  4. Writes the hosted URL (baseUrl + <slug>.mp4) into `src`.

After it runs:
  5. Upload Video/live/*.mp4 to the Supabase Storage bucket `artist-video`
     (same project as `artist-audio`, public read). Dashboard drag-and-drop
     is fine; the object name must equal the file name (live-01.mp4 ...).
  6. git add Video/manifest.json images/video/ && git commit && git push

pages/videos.html renders from the manifest: it tries the hosted `src`
first and falls back to the YouTube embed if the file isn't there yet, so
it is safe to commit the manifest before the upload is done.

ARCHIVE MODE — capture everything, not just the six
---------------------------------------------------
The six links live on channels (fans, venues, the band) that hold many more
L.A. Young clips. That footage is irreplaceable, so:

    python3 tools/capture-videos.py archive --list      # enumerate only, no downloads
    python3 tools/capture-videos.py archive             # download every match
    python3 tools/capture-videos.py archive --match ".*"   # every video on those channels

  - Channels are auto-discovered from each seed video's uploader, plus any
    URLs (channel / playlist / @handle) listed under "archiveSources" in the
    manifest — add fan channels there as you find them.
  - Only titles matching --match are pulled (default: L.A. Young / LA Young /
    Soul Society / Unusual Suspects, case-insensitive). Use ".*" for all.
  - Files land in Video/archive/<channel>/<youtubeId>.mp4 (gitignored) with a
    sidecar .info.json; Video/archive/index.json (committed) is the catalog.
  - Re-running is safe: yt-dlp's --download-archive skips what you already have.
"""
import argparse, json, os, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "Video", "manifest.json")
OUT_DIR = os.path.join(ROOT, "Video", "live")
POSTER_DIR = os.path.join(ROOT, "images", "video")


def need(tool):
    if shutil.which(tool) is None:
        sys.exit(f"'{tool}' not found. Install with: brew install {tool}")


def iso_duration(seconds):
    try:
        s = int(float(seconds))
    except (TypeError, ValueError):
        return ""
    h, s = divmod(s, 3600)
    m, s = divmod(s, 60)
    return "PT" + (f"{h}H" if h else "") + (f"{m}M" if m else "") + f"{s}S"


def fetch_meta(url):
    out = subprocess.run(
        ["yt-dlp", "--skip-download", "--print",
         "%(title)s\n%(duration)s\n%(upload_date)s", url],
        capture_output=True, text=True, check=True).stdout.strip().split("\n")
    title, duration, upload = (out + ["", "", ""])[:3]
    if len(upload) == 8:
        upload = f"{upload[:4]}-{upload[4:6]}-{upload[6:]}"
    return title, iso_duration(duration), upload


def download(url, slug):
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(POSTER_DIR, exist_ok=True)
    subprocess.run([
        "yt-dlp",
        "-f", "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--merge-output-format", "mp4",
        "--write-thumbnail", "--convert-thumbnails", "jpg",
        "-o", os.path.join(OUT_DIR, f"{slug}.%(ext)s"),
        url], check=True)
    thumb = os.path.join(OUT_DIR, f"{slug}.jpg")
    poster = os.path.join(POSTER_DIR, f"{slug}-poster.jpg")
    if os.path.exists(thumb):
        shutil.move(thumb, poster)
    return os.path.exists(os.path.join(OUT_DIR, f"{slug}.mp4")), os.path.exists(poster)


ARCHIVE_DIR = os.path.join(ROOT, "Video", "archive")
ARCHIVE_INDEX = os.path.join(ARCHIVE_DIR, "index.json")
DEFAULT_MATCH = r"(?i)\bL\.?\s?A\.?\s?Young\b|Soul Society|Unusual Suspects"


def channel_of(video_url):
    out = subprocess.run(
        ["yt-dlp", "--skip-download", "--print", "%(channel_url)s\n%(channel)s", video_url],
        capture_output=True, text=True, check=True).stdout.strip().split("\n")
    return (out + ["", ""])[0], (out + ["", ""])[1]


def list_source(url):
    """Flat listing of every video under a channel / playlist / handle URL."""
    src = url
    if "youtube.com/@" in src or "/channel/" in src or "/c/" in src or "/user/" in src:
        if not src.rstrip("/").endswith(("/videos", "/streams", "/shorts")):
            src = src.rstrip("/") + "/videos"
    out = subprocess.run(
        ["yt-dlp", "--flat-playlist", "--print",
         "%(id)s\t%(title)s\t%(duration)s\t%(upload_date)s\t%(channel)s", src],
        capture_output=True, text=True, check=True).stdout
    rows = []
    for line in out.splitlines():
        parts = (line.split("\t") + [""] * 5)[:5]
        if parts[0]:
            rows.append(dict(id=parts[0], title=parts[1], duration=iso_duration(parts[2]),
                             uploadDate=parts[3] if parts[3] != "NA" else "", channel=parts[4]))
    return rows


def slugify(text):
    import re
    return re.sub(r"[^a-z0-9]+", "-", (text or "channel").lower()).strip("-") or "channel"


def archive(args):
    import re
    with open(MANIFEST, encoding="utf-8") as f:
        manifest = json.load(f)
    pattern = re.compile(args.match or DEFAULT_MATCH)

    sources = {}  # channel_url -> channel name
    for v in manifest["videos"]:
        try:
            curl, cname = channel_of(f"https://www.youtube.com/watch?v={v['youtubeId']}")
            if curl:
                sources.setdefault(curl, cname)
        except subprocess.CalledProcessError as e:
            print(f"   !! could not resolve channel for {v['youtubeId']}: {e.stderr.strip()[:160]}")
    for extra in manifest.get("archiveSources", []):
        sources.setdefault(extra, "")

    index = {"generated": "", "sources": [], "videos": []}
    if os.path.exists(ARCHIVE_INDEX):
        with open(ARCHIVE_INDEX, encoding="utf-8") as f:
            index = json.load(f)
    known = {x["id"]: x for x in index.get("videos", [])}

    total_match = 0
    for url, name in sources.items():
        print(f"\n== source: {name or url}\n   {url}")
        try:
            rows = list_source(url)
        except subprocess.CalledProcessError as e:
            print(f"   !! listing failed: {e.stderr.strip()[:200]}")
            continue
        matches = [r for r in rows if pattern.search(r["title"] or "")]
        print(f"   {len(rows)} videos on channel, {len(matches)} match")
        total_match += len(matches)
        if url not in index["sources"]:
            index["sources"].append(url)
        chan_slug = slugify(name or matches[0]["channel"] if matches else name)
        for r in matches:
            print(f"   - {r['id']}  {r['title']}  [{r['duration']}]")
            entry = known.get(r["id"], {})
            entry.update(r, sourceUrl=url, youtubeUrl=f"https://youtu.be/{r['id']}")
            entry.setdefault("file", "")
            known[r["id"]] = entry
            if args.list:
                continue
            outdir = os.path.join(ARCHIVE_DIR, chan_slug)
            os.makedirs(outdir, exist_ok=True)
            subprocess.run([
                "yt-dlp",
                "-f", "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best",
                "--merge-output-format", "mp4",
                "--write-info-json", "--write-thumbnail", "--convert-thumbnails", "jpg",
                "--download-archive", os.path.join(ARCHIVE_DIR, "downloaded.txt"),
                "-o", os.path.join(outdir, "%(id)s.%(ext)s"),
                f"https://www.youtube.com/watch?v={r['id']}"], check=False)
            if os.path.exists(os.path.join(outdir, f"{r['id']}.mp4")):
                entry["file"] = os.path.relpath(os.path.join(outdir, f"{r['id']}.mp4"), ROOT)

    import datetime
    index["generated"] = datetime.date.today().isoformat()
    index["videos"] = sorted(known.values(), key=lambda x: (x.get("uploadDate") or "", x["id"]))
    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    with open(ARCHIVE_INDEX, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)
        f.write("\n")
    have = sum(1 for x in index["videos"] if x.get("file"))
    print(f"\nCatalog: {len(index['videos'])} matching videos across {len(sources)} sources, "
          f"{have} downloaded -> Video/archive/index.json")
    if args.list:
        print("List-only run. Re-run without --list to download.")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd")
    ap.add_argument("--dry-run", action="store_true", help="metadata only")
    ap.add_argument("--only", help="comma-separated slugs to process")
    ar = sub.add_parser("archive", help="capture every matching video on the source channels")
    ar.add_argument("--list", action="store_true", help="enumerate only, download nothing")
    ar.add_argument("--match", help=f"title regex (default: {DEFAULT_MATCH!r}); use '.*' for all")
    args = ap.parse_args()
    need("yt-dlp")
    if args.cmd == "archive":
        if not args.list:
            need("ffmpeg")
        return archive(args)
    if not args.dry_run:
        need("ffmpeg")

    with open(MANIFEST, encoding="utf-8") as f:
        manifest = json.load(f)
    base = manifest["baseUrl"].rstrip("/") + "/"
    only = set(args.only.split(",")) if args.only else None

    for v in manifest["videos"]:
        if only and v["slug"] not in only:
            continue
        url = f"https://www.youtube.com/watch?v={v['youtubeId']}"
        print(f"\n== {v['slug']}  {url}")
        try:
            title, duration, upload = fetch_meta(url)
        except subprocess.CalledProcessError as e:
            print(f"   !! metadata failed: {e.stderr.strip()[:200]}")
            continue
        v.update(title=title or v["title"], duration=duration, uploadDate=upload)
        print(f"   {title}  [{duration}]  {upload}")
        if args.dry_run:
            continue
        ok_mp4, ok_poster = download(url, v["slug"])
        if ok_mp4:
            v["src"] = base + f"{v['slug']}.mp4"
            print(f"   saved Video/live/{v['slug']}.mp4 -> src={v['src']}")
        if ok_poster:
            v["poster"] = f"images/video/{v['slug']}-poster.jpg"

    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"\nManifest updated: {os.path.relpath(MANIFEST, ROOT)}")
    if not args.dry_run:
        print("Next: upload Video/live/*.mp4 to Supabase bucket 'artist-video', "
              "then commit Video/manifest.json and images/video/.")


if __name__ == "__main__":
    main()
