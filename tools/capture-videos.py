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

  How it finds "the rest of the videos on those pages":
  - Seed channels: the uploader of each of the six links. EVERY video and
    stream on those channels is taken (no title filter — it's the band's own
    footage even when the title doesn't say "LA Young").
  - Curated playlists on those channels: often hold other people's uploads.
  - YouTube search sweep for the band (see DEFAULT_SEARCHES / manifest
    "archiveSearches") — catches fan and venue uploads we've never seen.
  - Channel hops: every matching video found above is followed to ITS
    uploader, and that channel is crawled too (--depth, default 1).
  - Extra starting points: any channel / playlist / @handle URLs listed under
    "archiveSources" in the manifest.
  - Outside the seed channels, only titles matching --match are kept
    (default: L.A. Young / LA Young / Soul Society / Unusual Suspects /
    Phyllis Hyman tribute / Gold Bottom, case-insensitive). ".*" keeps all.
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
DEFAULT_MATCH = (r"(?i)\bL\.?\s?A\.?\s?Young\b|Soul Society|Unusual Suspects|"
                 r"Phyllis Hyman (Experience|Tribute)|Gold Bottom")
DEFAULT_SEARCHES = [
    '"L.A. Young" singer', '"LA Young" soul', '"LA Young" jazz', '"LA Young" band',
    '"LA Young" "Soul Society"', '"LA Young" "Unusual Suspects"',
    '"LA Young" Phyllis Hyman', '"LA Young" Norman Connors', '"LA Young" Baltimore',
]
VIDEO_FMT = "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best"
PRINT_ROW = "%(id)s\t%(title)s\t%(duration)s\t%(upload_date)s\t%(channel)s\t%(channel_url)s"


def _run(args_):
    return subprocess.run(["yt-dlp"] + args_, capture_output=True, text=True, check=True).stdout


def _rows(out):
    rows = []
    for line in out.splitlines():
        parts = (line.split("\t") + [""] * 6)[:6]
        if parts[0] and parts[0] != "NA":
            rows.append(dict(id=parts[0], title=parts[1], duration=iso_duration(parts[2]),
                             uploadDate=parts[3] if parts[3] != "NA" else "",
                             channel=parts[4] if parts[4] != "NA" else "",
                             channelUrl=parts[5] if parts[5] != "NA" else ""))
    return rows


def video_info(video_id):
    return _rows(_run(["--skip-download", "--print", PRINT_ROW,
                       f"https://www.youtube.com/watch?v={video_id}"]))[0]


def flat_list(url):
    """Flat listing of a channel tab / playlist / search URL (no downloads)."""
    return _rows(_run(["--flat-playlist", "--ignore-errors", "--print", PRINT_ROW, url]))


def channel_tabs(channel_url):
    base = channel_url.rstrip("/")
    for tab in ("/videos", "/streams"):
        yield base + tab
    # Playlists the channel curated — these often hold OTHER people's uploads
    # of the band (a venue's "Soul Society night", a fan's tribute list).
    try:
        for pl in _run(["--flat-playlist", "--ignore-errors", "--print", "%(url)s", base + "/playlists"]).splitlines():
            if "list=" in pl:
                yield pl.strip()
    except subprocess.CalledProcessError:
        pass


def slugify(text):
    import re
    return re.sub(r"[^a-z0-9]+", "-", (text or "channel").lower()).strip("-") or "channel"


def download_one(video_id, outdir):
    os.makedirs(outdir, exist_ok=True)
    subprocess.run([
        "yt-dlp", "-f", VIDEO_FMT, "--merge-output-format", "mp4",
        "--write-info-json", "--write-thumbnail", "--convert-thumbnails", "jpg",
        "--download-archive", os.path.join(ARCHIVE_DIR, "downloaded.txt"),
        "-o", os.path.join(outdir, "%(id)s.%(ext)s"),
        f"https://www.youtube.com/watch?v={video_id}"], check=False)
    path = os.path.join(outdir, f"{video_id}.mp4")
    return os.path.relpath(path, ROOT) if os.path.exists(path) else ""


def archive(args):
    import datetime, re
    with open(MANIFEST, encoding="utf-8") as f:
        manifest = json.load(f)
    pattern = re.compile(args.match or DEFAULT_MATCH)
    seed_ids = [v["youtubeId"] for v in manifest["videos"]]

    index = {"generated": "", "sources": [], "videos": []}
    if os.path.exists(ARCHIVE_INDEX):
        with open(ARCHIVE_INDEX, encoding="utf-8") as f:
            index = json.load(f)
    known = {x["id"]: x for x in index.get("videos", [])}

    # ---- 1. Seed videos + their channels are always in (no title filter) ----
    channels = {}      # channel_url -> {"name":..., "depth": n}
    found = {}         # video id -> row + provenance
    print("== resolving the seed videos")
    for vid in seed_ids:
        try:
            r = video_info(vid)
        except (subprocess.CalledProcessError, IndexError) as e:
            print(f"   !! {vid}: could not resolve ({getattr(e, 'stderr', '')[:120]})")
            continue
        r["via"] = "seed"
        r["depth"] = 0
        found[vid] = r
        print(f"   {vid}  {r['title']}  — {r['channel']}")
        if r["channelUrl"]:
            channels.setdefault(r["channelUrl"], {"name": r["channel"], "depth": 0})
    for extra in manifest.get("archiveSources", []):
        channels.setdefault(extra, {"name": "", "depth": 0})

    def consider(row, via, depth):
        """Keep a row if it matches the band; return True if it is new."""
        if row["id"] in found:
            return False
        if not pattern.search(row["title"] or ""):
            return False
        row["via"] = via
        row["depth"] = depth
        found[row["id"]] = row
        return True

    # ---- 2. YouTube search — catches uploads from channels we don't know ----
    if not args.no_search:
        for q in manifest.get("archiveSearches") or DEFAULT_SEARCHES:
            url = f"ytsearch{args.search_limit}:{q}"
            try:
                rows = flat_list(url)
            except subprocess.CalledProcessError as e:
                print(f"   !! search failed {q!r}: {e.stderr.strip()[:120]}")
                continue
            new = sum(consider(r, f"search:{q}", 0) for r in rows)
            print(f"== search {q!r}: {len(rows)} results, {new} new matches")

    # ---- 3. Crawl channels: videos + streams + curated playlists; then follow
    #         every matching video to ITS channel, up to --depth levels out. ----
    crawled = set()
    while True:
        todo = [(u, m) for u, m in channels.items() if u not in crawled and m["depth"] <= args.depth]
        if not todo:
            break
        for curl, meta in todo:
            crawled.add(curl)
            print(f"\n== channel: {meta['name'] or curl}  (depth {meta['depth']})\n   {curl}")
            if curl not in index["sources"]:
                index["sources"].append(curl)
            for tab in channel_tabs(curl):
                try:
                    rows = flat_list(tab)
                except subprocess.CalledProcessError as e:
                    print(f"   !! {tab}: {e.stderr.strip()[:120]}")
                    continue
                # A seed channel's own uploads are the band's footage even when
                # the title doesn't say so; other channels must match by title.
                own = meta["depth"] == 0 and tab.startswith(curl.rstrip("/") + "/")
                new = 0
                for r in rows:
                    if own and r["id"] not in found:
                        r["via"] = f"channel:{meta['name'] or curl}"
                        r["depth"] = meta["depth"]
                        found[r["id"]] = r
                        new += 1
                    else:
                        new += consider(r, f"channel:{meta['name'] or curl}", meta["depth"])
                print(f"   {tab.split('youtube.com/')[-1][:70]}: {len(rows)} videos, {new} new")
        # expand: a matching video's uploader becomes a channel one hop out
        for r in found.values():
            cu = r.get("channelUrl")
            if cu and cu not in channels:
                channels[cu] = {"name": r.get("channel", ""), "depth": r.get("depth", 0) + 1}

    # ---- 4. Catalog + download ----
    for vid, r in found.items():
        entry = known.get(vid, {})
        entry.update({k: r[k] for k in ("id", "title", "duration", "uploadDate", "channel", "channelUrl", "via")})
        entry["youtubeUrl"] = f"https://youtu.be/{vid}"
        entry.setdefault("file", "")
        known[vid] = entry
    print(f"\n== {len(found)} band videos found across {len(crawled)} channels")
    for r in sorted(found.values(), key=lambda x: (x.get("channel") or "", x.get("uploadDate") or "")):
        print(f"   {r['id']}  {r['uploadDate'] or '????-??-??'}  {r['title'][:60]:60}  {r['channel'][:24]}  [{r['via'].split(':')[0]}]")

    if not args.list:
        for vid, entry in known.items():
            if entry.get("file") and os.path.exists(os.path.join(ROOT, entry["file"])):
                continue
            outdir = os.path.join(ARCHIVE_DIR, slugify(entry.get("channel")))
            print(f"\n-- downloading {vid}  {entry['title'][:60]}")
            entry["file"] = download_one(vid, outdir) or entry.get("file", "")

    index["generated"] = datetime.date.today().isoformat()
    index["match"] = pattern.pattern
    index["videos"] = sorted(known.values(), key=lambda x: (x.get("channel") or "", x.get("uploadDate") or "", x["id"]))
    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    with open(ARCHIVE_INDEX, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)
        f.write("\n")
    have = sum(1 for x in index["videos"] if x.get("file"))
    print(f"\nCatalog: {len(index['videos'])} videos, {have} downloaded -> Video/archive/index.json")
    if args.list:
        print("List-only run. Review Video/archive/index.json, then re-run without --list to download.")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd")
    ap.add_argument("--dry-run", action="store_true", help="metadata only")
    ap.add_argument("--only", help="comma-separated slugs to process")
    ar = sub.add_parser("archive", help="capture every matching video on the source channels")
    ar.add_argument("--list", action="store_true", help="enumerate only, download nothing")
    ar.add_argument("--match", help=f"title regex (default: {DEFAULT_MATCH!r}); use '.*' for all")
    ar.add_argument("--depth", type=int, default=1,
                    help="how many channel hops to follow from a matching video (default 1; 0 = seed channels only)")
    ar.add_argument("--search-limit", type=int, default=100, help="results per YouTube search query (default 100)")
    ar.add_argument("--no-search", action="store_true", help="skip the YouTube search sweep")
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
