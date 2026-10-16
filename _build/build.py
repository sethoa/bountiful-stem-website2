#!/usr/bin/env python3
"""Generates the static pages for www.bountifulstem.org.

Edit the SITE settings, GIVING_LEVELS, VIDEOS or a page's body below, then run:
    python3 _build/build.py
Output is written to the site root (index.html, about.html, ...), plus sitemap.xml.
"""
import html
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SITE = {
    "name": "Bountiful STEM Educational Foundation",
    "short": "Bountiful STEM",
    "url": "https://www.bountifulstem.org",
    "email": "info@bountifulstemeducationalfoundation.org",
    "ein": "87-2018269",
    "office_gh": "Weija, Accra, Ghana",
    "office_us": "Washington, Utah, USA",
    # Paste your online giving link here (PayPal, Givebutter, Donorbox, etc.).
    # While empty, Donate buttons open the contact form with "Making a donation" selected.
    "donate_url": "",
    "linkedin": "https://www.linkedin.com/company/bountiful-stem-educational-foundation",
    # Paste your YouTube channel URL here. While empty, the YouTube icon opens videos.html.
    "youtube": "",
}

# Example amounts. Confirm what each amount really funds before launch.
GIVING_LEVELS = [
    ("$15", "helps buy spare parts and batteries for a school robotics club"),
    ("$35", "helps give one student a seat at the Girl Powered STEM Workshop"),
    ("$75", "helps train a rural teacher to lead robotics and coding lessons"),
    ("$150", "helps register a school team for a national robotics competition"),
    ("$500", "helps equip a school club with a VEX IQ robotics kit"),
    ("$1,500", "helps send a student to the VEX Robotics World Championship"),
]

VIDEOS = [
    ("6gom8QJ27_w", "Ghana's first elementary robotics team at VEX IQ Worlds",
     "In 2022, Ghana sent its first elementary school VEX IQ team to the VEX Robotics World Championship in Dallas, Texas."),
    ("CFCUrV1WrHU", "VEX Robotics & STEM Competition: Ghana National Championship 2023",
     "Bountiful Technologies and Bountiful STEM Educational Foundation organized Ghana's first VEX Robotics Competitions and STEM Challenge with our partners."),
    ("wdZeTYU2Cg4", "Ghanaian students competing at the VEX Robotics World Championship",
     "Team Ghana takes on the best young engineers in the world at the 2024 VEX Robotics World Championship in Dallas."),
]

NAV = [
    ("About", "about.html", [
        ("Who We Are", "about.html"),
        ("Board & Staff", "board-staff.html"),
        ("Reports & Financials", "reports.html"),
    ]),
    ("Programs", "programs.html", None),
    ("Locations", "locations.html", None),
    ("Get Involved", "get-involved.html", [
        ("Volunteer", "get-involved.html#volunteer"),
        ("Corporate Partners", "get-involved.html#corporate"),
        ("Plan a Fundraiser", "get-involved.html#fundraiser"),
        ("Donate Equipment", "get-involved.html#equipment"),
    ]),
    ("Events", "events.html", None),
    ("News", "news.html", None),
    ("Videos", "videos.html", None),
    ("Contact", "contact.html", None),
]

ICONS = {
    "robot": '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="11" rx="2"/><path d="M12 4v4M9 13h.01M15 13h.01M9 16h6M2 12v3M22 12v3"/></svg>',
    "teacher": '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h18v11H3z"/><path d="M8 20l4-5 4 5M7 8h6M7 11h4"/></svg>',
    "girl": '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M12 12v9M8.5 17.5h7"/></svg>',
    "camp": '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20h18M5 20V10l7-5 7 5v10"/><path d="M9 20v-6h6v6"/></svg>',
    "trophy": '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3a3 3 0 0 1-3 4M7 5H4a3 3 0 0 0 3 4"/></svg>',
    "center": '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8M12 16v4"/></svg>',
    "heart": '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/></svg>',
    "laptop": '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="10" rx="1"/><path d="M2 19h20"/></svg>',
    "hands": '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M14 20a4 4 0 0 1 7-2.6"/></svg>',
    "link": '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    "flag": '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
    "pin": '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
}

LINKEDIN_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4V21H3zM9.5 9.75h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5c0-1.2-.02-2.73-1.66-2.73-1.67 0-1.93 1.3-1.93 2.64V21H9.5z"/></svg>'
YOUTUBE_ICON = '<svg width="20" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.75 15.1V8.9L15.5 12z"/></svg>'
PLAY_ICON = '<svg width="68" height="48" viewBox="0 0 68 48" aria-hidden="true"><path d="M66.5 7.7A8.5 8.5 0 0 0 60.5 1.7C55.2.3 34 .3 34 .3S12.8.3 7.5 1.7A8.5 8.5 0 0 0 1.5 7.7C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z" fill="#c4302b"/><path d="M27 34.5 44.5 24 27 13.5z" fill="#fff"/></svg>'


def donate_href():
    return "donate.html"


def youtube_href():
    return SITE["youtube"] or "videos.html"


def head(page):
    canonical = SITE["url"] + "/" + ("" if page["file"] == "index.html" else page["file"])
    title = page["title"]
    desc = page["description"]
    schema = page.get("schema", [])
    schema_html = "".join(
        f'\n<script type="application/ld+json">{json.dumps(s, ensure_ascii=False)}</script>' for s in schema
    )
    robots = "noindex" if page.get("noindex") else "index, follow, max-image-preview:large"
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="{desc}">
<meta name="robots" content="{robots}">
<link rel="canonical" href="{canonical}">
<meta name="theme-color" content="#0b1f52">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{SITE['name']}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE['url']}/assets/img/og-image.png">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{SITE['url']}/assets/img/og-image.png">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap">
<link rel="stylesheet" href="assets/css/style.css">{schema_html}
</head>
<body>
<a class="skip" href="#main">Skip to main content</a>
"""


def social_links(cls=""):
    yt_attrs = ' rel="me noopener" target="_blank"' if SITE["youtube"] else ""
    return (
        f'<a class="social {cls}" href="{SITE["linkedin"]}" rel="me noopener" target="_blank" aria-label="Bountiful STEM on LinkedIn">{LINKEDIN_ICON}<span>LinkedIn</span></a>'
        f'<a class="social {cls}" href="{youtube_href()}"{yt_attrs} aria-label="Bountiful STEM videos on YouTube">{YOUTUBE_ICON}<span>YouTube</span></a>'
    )


def header(active):
    current = ' aria-current="page"'
    items = []
    for i, (label, href, children) in enumerate(NAV):
        is_active = active == href or (children and any(active == c[1] for c in children))
        if children:
            sub = "".join(
                f'<li><a href="{ch}"{current if ch == active else ""}>{cl}</a></li>' for cl, ch in children
            )
            items.append(
                f'<li class="has-sub{" is-active" if is_active else ""}">'
                f'<button class="sub-toggle" type="button" aria-expanded="false" aria-controls="sub-{i}">{label}'
                f'<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>'
                f'<ul class="sub" id="sub-{i}">{sub}</ul></li>'
            )
        else:
            items.append(f'<li><a href="{href}"{current if is_active else ""}>{label}</a></li>')
    items_html = "\n        ".join(items)
    return f"""<div class="topbar">
  <div class="wrap topbar-inner">
    <span class="topbar-note">US 501(c)(3) nonprofit serving students in Ghana</span>
    <div class="topbar-links">
      <span class="topbar-email">{SITE['email']}</span>
      {social_links("social-sm")}
    </div>
  </div>
</div>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="index.html" aria-label="{SITE['name']} home">
      <img src="assets/img/logo.svg" alt="" width="44" height="44">
      <span class="brand-name">Bountiful STEM<small>Educational Foundation</small></span>
    </a>
    <div class="header-actions">
      <a class="btn btn-gold btn-sm donate-mobile" href="{donate_href()}">Donate</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    </div>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <ul class="nav-list">
        {items_html}
        <li class="nav-donate"><a class="btn btn-gold" href="{donate_href()}"{current if active == 'donate.html' else ''}>Donate</a></li>
      </ul>
    </nav>
  </div>
</header>
<main id="main">
"""


def footer():
    year = date.today().year
    about_links = "".join(f'<li><a href="{h}">{l}</a></li>' for l, h in NAV[0][2]) + \
        '<li><a href="programs.html">Programs</a></li><li><a href="locations.html">Locations</a></li>'
    involve_links = "".join(f'<li><a href="{h}">{l}</a></li>' for l, h in NAV[3][2]) + \
        '<li><a href="donate.html">Ways to Give</a></li><li><a href="events.html">Events</a></li>'
    return f"""</main>
<div class="kente" role="presentation"></div>
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-cols">
      <div class="stack">
        <a class="brand" href="index.html">
          <img src="assets/img/logo.svg" alt="" width="44" height="44">
          <span class="brand-name">Bountiful STEM<small>Educational Foundation</small></span>
        </a>
        <p>Equitable access to STEM, robotics, AI, coding and computer science education for children and teachers in Ghana and West Africa.</p>
        <p><strong>US 501(c)(3) nonprofit · EIN {SITE['ein']}</strong><br>Gifts are tax-deductible to the extent allowed by US law.</p>
        <div class="footer-social">{social_links()}</div>
      </div>
      <div>
        <h2>About</h2>
        <ul>{about_links}</ul>
      </div>
      <div>
        <h2>Get involved</h2>
        <ul>{involve_links}</ul>
      </div>
      <div>
        <h2>Reach us</h2>
        <ul>
          <li>{SITE['email']}</li>
          <li>Ghana office: {SITE['office_gh']}</li>
          <li>US office: {SITE['office_us']}</li>
          <li><a href="contact.html">Send us a message</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-legal">
      <span>© <span data-year>{year}</span> {SITE['name']}. All rights reserved.</span>
      <button class="theme-toggle" type="button" data-theme-toggle>Theme: system</button>
    </div>
  </div>
</footer>
<script src="assets/js/main.js" defer></script>
</body>
</html>
"""


def page_hero(eyebrow, h1, lede, crumb=None):
    crumb_html = ""
    if crumb:
        crumb_html = f'<nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><span>{crumb}</span></nav>'
    return f"""<section class="hero page-hero">
  <div class="hero-grid" aria-hidden="true"></div>
  <div class="wrap stack">
    {crumb_html}
    <p class="eyebrow">{eyebrow}</p>
    <h1>{h1}</h1>
    <p class="lede">{lede}</p>
  </div>
</section>
<div class="kente" role="presentation"></div>
"""


def cta_band(title, text):
    return f"""<section class="cta-band">
  <div class="wrap">
    <div class="stack">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
    <div class="btn-row">
      <a class="btn btn-brand" href="{donate_href()}">Donate now</a>
      <a class="btn btn-ghost" href="get-involved.html">Other ways to help</a>
    </div>
  </div>
</section>
"""


def section_head(eyebrow, title, lede=""):
    lede_html = f'<p class="lede">{lede}</p>' if lede else ""
    return f'<div class="section-head"><p class="eyebrow">{eyebrow}</p><h2>{title}</h2>{lede_html}</div>'


def card(icon, title, text, link=None, tag=""):
    tag_html = f'<p class="tag">{tag}</p>' if tag else ""
    link_html = f'<p class="card-link"><a href="{link[1]}">{link[0]} <span aria-hidden="true">→</span></a></p>' if link else ""
    return f"""<article class="card">
  <div class="icon">{ICONS[icon]}</div>
  <h3>{title}</h3>
  <p>{text}</p>{tag_html}{link_html}
</article>"""


def video(vid, title, text, heading="h3"):
    t = html.escape(title)
    return f"""<article class="video-card">
  <div class="video" data-yt="{vid}" data-title="{t}">
    <img src="https://i.ytimg.com/vi/{vid}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360" onerror="this.remove()">
    <button class="video-play" type="button" aria-label="Play video: {t}">{PLAY_ICON}</button>
  </div>
  <{heading}>{t}</{heading}>
  <p>{text}</p>
  <p class="card-link"><a href="https://www.youtube.com/watch?v={vid}" rel="noopener" target="_blank">Watch on YouTube <span aria-hidden="true">↗</span></a></p>
</article>"""


def giving_grid():
    return '<div class="giving">' + "".join(
        f'<a class="give" href="{donate_href()}"><b>{amt}</b><span>{txt}</span></a>' for amt, txt in GIVING_LEVELS
    ) + "</div>"


PROGRAM_CARDS = [
    ("robot", "School STEM & Robotics Clubs", "Weekly after-school clubs where students design, build and code robots with VEX IQ and VEX V5 kits, led by teachers we train.", "programs.html#clubs"),
    ("teacher", "Teacher Training", "Hands-on professional development so rural teachers can teach robotics, coding and science with confidence.", "programs.html#teachers"),
    ("girl", "Girl Powered STEM Workshop", "Our annual workshop opening robotics, AI, VR and IoT to girls, with mentoring from women in STEM careers.", "programs.html#girl-powered"),
    ("camp", "Future Engineers BootCamp", "A holiday bootcamp of real engineering challenges that ends with the Ultimate Robot Challenge.", "programs.html#bootcamp"),
    ("trophy", "Robotics Competitions", "We prepare and sponsor teams from school events to the Ghana National Championship and VEX Worlds.", "programs.html#competitions"),
    ("center", "STEM Centers & Equipment", "Community STEM centers and donated kits and computers that turn ordinary classrooms into labs.", "programs.html#centers"),
]

HERO_ART = """<svg class="hero-art" viewBox="0 0 420 360" role="img" aria-label="Illustration of a student-built robot carrying a seedling">
  <rect x="40" y="300" width="340" height="10" rx="5" fill="#f0b323"/>
  <rect x="110" y="140" width="200" height="130" rx="18" fill="#0b1f52" stroke="#ffffff" stroke-opacity=".5" stroke-width="3"/>
  <circle cx="165" cy="200" r="20" fill="#f0b323"/>
  <circle cx="255" cy="200" r="20" fill="#f0b323"/>
  <circle cx="165" cy="200" r="7" fill="#0b1f52"/>
  <circle cx="255" cy="200" r="7" fill="#0b1f52"/>
  <rect x="180" y="238" width="60" height="10" rx="5" fill="#1d7f4a"/>
  <circle cx="145" cy="290" r="22" fill="#0b1f52" stroke="#f0b323" stroke-width="5"/>
  <circle cx="275" cy="290" r="22" fill="#0b1f52" stroke="#f0b323" stroke-width="5"/>
  <rect x="204" y="96" width="12" height="44" fill="#ffffff" fill-opacity=".7"/>
  <path d="M210 96c0-34 22-52 52-56-2 30-20 52-52 56z" fill="#3fb877"/>
  <path d="M210 104c0-26-16-40-40-44 2 24 16 40 40 44z" fill="#1d7f4a"/>
  <rect x="70" y="170" width="40" height="12" rx="6" fill="#ffffff" fill-opacity=".6"/>
  <rect x="310" y="170" width="40" height="12" rx="6" fill="#ffffff" fill-opacity=".6"/>
  <rect x="52" y="160" width="22" height="32" rx="6" fill="#c23b2c"/>
  <rect x="346" y="160" width="22" height="32" rx="6" fill="#c23b2c"/>
</svg>"""

ORG_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "NGO",
    "@id": SITE["url"] + "/#organization",
    "name": SITE["name"],
    "alternateName": ["Bountiful STEM", "Bountiful STEM Foundation"],
    "url": SITE["url"] + "/",
    "logo": SITE["url"] + "/assets/img/logo.svg",
    "email": SITE["email"],
    "description": "Bountiful STEM Educational Foundation is a US-based 501(c)(3) global nonprofit transforming lives through equitable access to STEM, robotics, artificial intelligence, coding and computer science education in Ghana and West Africa.",
    "foundingDate": "2019",
    "founders": [{"@type": "Person", "name": "Seth Ogoe Ayim"}, {"@type": "Person", "name": "Tom Campbell"}],
    "nonprofitStatus": "Nonprofit501c3",
    "taxID": SITE["ein"],
    "areaServed": [{"@type": "Country", "name": "Ghana"}, {"@type": "Place", "name": "West Africa"}],
    "address": [
        {"@type": "PostalAddress", "addressLocality": "Weija, Accra", "addressCountry": "GH"},
        {"@type": "PostalAddress", "addressLocality": "Washington", "addressRegion": "UT", "addressCountry": "US"},
    ],
    "knowsAbout": ["STEM education", "Robotics", "Artificial intelligence", "Coding", "Computer science", "Teacher training", "Girls in STEM", "VEX Robotics"],
    "sameAs": [u for u in (SITE["linkedin"], SITE["youtube"]) if u],
}

WEBSITE_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE["name"],
    "url": SITE["url"] + "/",
    "publisher": {"@id": SITE["url"] + "/#organization"},
}


def breadcrumb(name, file):
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE["url"] + "/"},
            {"@type": "ListItem", "position": 2, "name": name, "item": f"{SITE['url']}/{file}"},
        ],
    }


NEWS_ITEMS = [
    ("vex-worlds-2026", "2026-04-21", "April 2026", "Our VEX teams head to the 2026 World Championship in St. Louis",
     "Ghanaian VEX Robotics teams supported by the foundation and Bountiful Technologies travelled to the 2026 VEX Robotics World Championship, held April 21–30 at America's Center in St. Louis, Missouri."),
    ("airtad-2026", "2026-02-27", "February 27, 2026", "Labone SHS, a team we sponsor, wins the AIRTAD'26 robotics championship",
     "The Labone Senior High School robotics team won the senior high school robotics competition at AIRTAD'26 (the Annual Impact Roundtable Discussion) at the Cedi Conference Centre in Accra, edging PRESEC Legon in a close final. Congratulations to Chima John, Abdul-Salim Muhammed, Cruz Oppong Boahene and Eastwood Tetteh."),
    ("girl-powered-6", "2025-10-25", "October 25, 2025", "Girl Powered Workshop 6.0",
     "Our sixth Girl Powered Workshop brought students ages 5–18 together for a day of robotics, coding and mentoring focused on opening STEM careers to girls."),
    ("dreamers-wish", "2025-01-17", "January 17, 2025", "Dreamers Wish Foundation partnership launches a STEAM center in rural Ghana",
     "Dreamers Wish Foundation, Bountiful Technologies and Bountiful STEM Educational Foundation launched a STEAM education initiative that brings robotics, coding, AR/VR, artificial intelligence, electronics and vocational skills training to a rural community."),
    ("national-championship-2024", "2024-12-03", "December 2024", "2024 VEX Robotics Ghana National Championship",
     "Teams from across Ghana, including Ayeyi Tech, Kente Coders and Bounti Turbo, competed for the chance to represent Ghana at the 2025 VEX Robotics World Championship."),
    ("girl-powered-5", "2024-10-19", "October 19, 2024", "More than 150 students join our 5th Girl Powered STEM Workshop",
     "Girls and boys from schools around Accra spent the day on hands-on robotics, coding, AI, virtual reality and IoT projects, followed by career mentoring. The workshop is supported by VEX Robotics, the REC Foundation, Bountiful Technologies and partners including Reading Horizons."),
    ("vex-worlds-2024", "2024-04-25", "April 2024", "18 Ghanaian students compete at the VEX Robotics World Championship",
     "Students from schools across Ghana travelled to Dallas, Texas, to compete from April 25 to May 4, 2024. It was the third straight year Ghanaian elementary and middle school teams reached Worlds."),
    ("reading-horizons", "2024-01-16", "January 16, 2024", "Partnership with Reading Horizons",
     "We began a pilot with Reading Horizons focused on teacher-led, technology-supported learning, pairing strong reading skills with our STEM programs."),
    ("atiwa-west", "2020-08-22", "August 22, 2020", "Robotics kits worth GH₵60,000+ donated to Atiwa West District",
     "After teacher training in Abomosu in December 2019 and January 2020, we donated robotics kits so trained teachers could put their skills into practice. Supporters included former HP computers executive Chet Harmer and two retired American educators. The District Education Directorate is using the kits to start STEM clubs across its six circuits."),
]


def news_list(items, link=False):
    out = []
    for slug, iso, label, title, text in items:
        h = f'<a href="news.html#{slug}">{title}</a>' if link else title
        body = "" if link else f"<p>{text}</p>"
        out.append(f'<article class="post" id="{slug}"><time datetime="{iso}">{label}</time><h3>{h}</h3>{body}</article>')
    return "".join(out)


EVENTS = [
    ("Registration open", "Future Engineers BootCamp 2026",
     "Students design earthquake-resistant structures, build robots and compete in the Ultimate Robot Challenge. Register a student or a school group.",
     ("Register interest", "contact.html?topic=events")),
    ("October 2026 · date to be announced", "Girl Powered STEM Workshop 7.0",
     "Our annual workshop for students ages 5–18, held around the International Day of the Girl Child. Ask to be told the date as soon as it's set.",
     ("Get notified", "contact.html?topic=events")),
    ("Every year", "VEX Robotics Ghana National Championship",
     "School teams from across Ghana compete, and the top teams qualify for the VEX Robotics World Championship. Sponsors, volunteers and judges are welcome.",
     ("Sponsor or volunteer", "get-involved.html#corporate")),
]


def event_cards(events):
    return "".join(
        f'<article class="card event"><p class="tag">{tag}</p><h3>{t}</h3><p>{txt}</p><p class="card-link"><a href="{l[1]}">{l[0]} <span aria-hidden="true">→</span></a></p></article>'
        for tag, t, txt, l in events
    )


# ---------------------------------------------------------------- pages

HOME = f"""<section class="hero">
  <div class="hero-grid" aria-hidden="true"></div>
  <div class="wrap">
    <div class="stack-lg">
      <div class="stack">
        <p class="eyebrow">STEM, robotics &amp; AI education in Ghana</p>
        <h1>Ghana's future engineers <em>start here.</em></h1>
        <p class="lede">We give children in rural and underserved communities equal access to robotics, coding, artificial intelligence and computer science, and train the teachers who keep it going.</p>
      </div>
      <div class="btn-row">
        <a class="btn btn-gold" href="{donate_href()}">Donate today</a>
        <a class="btn btn-ghost" href="programs.html">Explore our programs</a>
      </div>
    </div>
    {HERO_ART}
  </div>
</section>
<div class="kente" role="presentation"></div>

<section class="intro">
  <div class="wrap intro-inner">
    <p class="intro-mission"><strong>Our mission:</strong> transforming lives through equitable access to STEM, robotics, AI, coding and computer science education.</p>
    <ul class="facts">
      <li><b>2019</b><span>Founded in Ghana</span></li>
      <li><b>2021</b><span>US 501(c)(3) in Utah</span></li>
      <li><b>5–18</b><span>Ages we serve</span></li>
    </ul>
  </div>
</section>

<section class="section">
  <div class="wrap">
    {section_head("Our programs", "Programs that turn curiosity into skills", "Every program is hands-on. Students build, code and test real machines, and teachers leave able to run the lessons on their own.")}
    <div class="grid grid-3">
      {"".join(card(i, t, d, ("Learn more", l)) for i, t, d, l in PROGRAM_CARDS)}
    </div>
  </div>
</section>

<section class="section section-tint">
  <div class="wrap">
    {section_head("Your gift at work", "What your donation can do", "Every gift goes to students and teachers in Ghana. Choose an amount to give.")}
    {giving_grid()}
    <p class="fineprint" style="margin-top:1rem">Amounts show examples of what gifts help fund. Your gift supports wherever the need is greatest.</p>
  </div>
</section>

<section class="section section-brand">
  <div class="wrap stack-lg">
    {section_head("Our impact", "What your support has made possible")}
    <div class="stats">
      <div class="stat"><b>2,000+</b><span>students reached through our robotics and STEM programs</span></div>
      <div class="stat"><b>GH₵60k+</b><span>in robotics kits donated to schools in Atiwa West District</span></div>
      <div class="stat"><b>150+</b><span>students at our 5th Girl Powered STEM Workshop</span></div>
      <div class="stat"><b>4 yrs</b><span>of Ghanaian teams at the VEX Robotics World Championship</span></div>
    </div>
    <p class="fineprint">Figures from foundation program records, 2019–2026. <a href="about.html#impact">Read our full story</a>.</p>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div class="stack">
      <p class="eyebrow">Watch</p>
      <h2>See our students in action</h2>
      <p>From a school club in Ghana to the VEX Robotics World Championship. Watch Ghana's first elementary robotics team take on the world.</p>
      <div class="btn-row"><a class="btn btn-brand" href="videos.html">More videos</a><a class="btn btn-ghost" href="{youtube_href()}">{YOUTUBE_ICON} YouTube</a></div>
    </div>
    {video(*VIDEOS[0])}
  </div>
</section>

<section class="section section-tint">
  <div class="wrap">
    {section_head("Upcoming events", "Join us at our next event")}
    <div class="grid grid-3">{event_cards(EVENTS)}</div>
    <p class="card-link" style="margin-top:1.5rem"><a href="events.html">All events <span aria-hidden="true">→</span></a></p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    {section_head("Latest news", "News from the field")}
    <div>{news_list(NEWS_ITEMS[:3], link=True)}</div>
    <div class="btn-row" style="margin-top:1.5rem"><a class="btn btn-brand" href="news.html">All news</a><a class="btn btn-ghost" href="{SITE['linkedin']}" rel="noopener" target="_blank">{LINKEDIN_ICON} Follow us on LinkedIn</a></div>
  </div>
</section>

<section class="section section-tint">
  <div class="wrap">
    {section_head("Get involved", "There's a place for everyone")}
    <div class="grid grid-4">
      {card("hands", "Volunteer", "Mentor students online, judge a competition or help run a workshop in Ghana.", ("Volunteer", "get-involved.html#volunteer"))}
      {card("link", "Corporate partners", "Sponsor a club, a STEM center or a team's trip to the World Championship.", ("Partner with us", "get-involved.html#corporate"))}
      {card("flag", "Plan a fundraiser", "Run a birthday, school or workplace fundraiser. We'll give you everything you need.", ("Get ideas", "get-involved.html#fundraiser"))}
      {card("laptop", "Donate equipment", "Working laptops, tablets and robotics kits become coding stations in rural schools.", ("Donate equipment", "get-involved.html#equipment"))}
    </div>
  </div>
</section>

<section class="section partners-band">
  <div class="wrap">
    <p class="eyebrow" style="text-align:center">Thank you to our partners</p>
    <ul class="partners">
      <li>Bountiful Technologies Ltd</li><li>VEX Robotics</li><li>REC Foundation</li><li>Dreamers Wish Foundation</li><li>Reading Horizons</li><li>Ghana Education Service</li>
    </ul>
  </div>
</section>
""" + cta_band("Put a robot in a rural classroom.", "Your gift helps a school start its first STEM club, with kits, a trained teacher and a team ready to compete.")

ABOUT = page_hero(
    "Who we are",
    "Closing the STEM gap between Ghana's cities and its villages",
    "Bountiful STEM Educational Foundation is a US-based 501(c)(3) global nonprofit transforming lives through equitable access to STEM, robotics, artificial intelligence, coding and computer science education.",
    "About",
) + f"""
<section class="section">
  <div class="wrap mv">
    <div class="mv-item"><h3>Mission</h3><p>To transform lives through equitable access to STEM, robotics, AI, coding and computer science education, starting with the rural and underserved communities that need it most.</p></div>
    <div class="mv-item"><h3>Vision</h3><p>A Ghana and West Africa where every rural community has trained STEM teachers and a STEM center its children can walk to.</p></div>
  </div>
</section>

<section class="section section-tint">
  <div class="wrap split" style="align-items:start">
    <div class="stack">
      <p class="eyebrow">Our story</p>
      <h2>It started with one district and a box of robots</h2>
      <p>Bountiful STEM Educational Foundation was founded in Ghana in 2019 by Bountiful Technologies Ltd, and was established as a US 501(c)(3) nonprofit in Utah in 2021.</p>
      <p>In late 2019, our team ran its first teacher-training sessions in Abomosu, in Ghana's Atiwa West District. Teachers were eager, but their schools had no equipment to practice with. In August 2020, with help from supporters in the United States, including former HP computers executive Chet Harmer and two retired American educators, we donated robotics kits worth more than GH₵60,000 to the district. Schools used them to launch STEM clubs across six circuits.</p>
      <p>That model guides us today: train local teachers, equip their schools, and support students from their first robot all the way to international competition.</p>
    </div>
    <div class="stack">
      <p class="eyebrow">What we believe</p>
      <ul class="checklist">
        <li><strong>Access for all.</strong> Where a child lives should not decide what they can learn.</li>
        <li><strong>Learning by doing.</strong> Students learn engineering by building, failing, fixing and building again.</li>
        <li><strong>Girls in STEM.</strong> We work for equal representation of girls in every club, workshop and team.</li>
        <li><strong>Lasting change.</strong> We train local teachers so programs keep running long after our visit.</li>
      </ul>
    </div>
  </div>
</section>

<section class="section" id="impact">
  <div class="wrap split" style="align-items:start">
    <div class="stack">
      <p class="eyebrow">Milestones</p>
      <h2>Our journey so far</h2>
      <p>Each step built on the last: training came first, then equipment, then clubs, then competition.</p>
      <p>Our founder's work was featured in <em>BYU Magazine</em>'s “Putting Down STEM Roots in Ghana.” <a href="https://magazine.byu.edu/article/putting-down-stem-roots-in-ghana" rel="noopener" target="_blank">Read the article</a>.</p>
    </div>
    <ol class="timeline">
      <li><time datetime="2019-11">2019</time><h3>Founded in Ghana</h3><p>First teacher training in Abomosu, Atiwa West District, in December 2019 and January 2020.</p></li>
      <li><time datetime="2020-08">August 2020</time><h3>GH₵60,000+ in robotics kits</h3><p>Kits donated to Atiwa West launch school STEM clubs across six circuits.</p></li>
      <li><time datetime="2021">2021</time><h3>US 501(c)(3) in Utah</h3><p>The foundation is established in Washington, Utah, so US supporters can give tax-deductibly.</p></li>
      <li><time datetime="2022">2022</time><h3>Ghana's first VEX IQ teams at Worlds</h3><p>Elementary and middle school students represent Ghana at the VEX Robotics World Championship in Dallas.</p></li>
      <li><time datetime="2024-04">April 2024</time><h3>18 students to Worlds</h3><p>Students from schools across Ghana compete in Dallas for the third straight year.</p></li>
      <li><time datetime="2024-10">October 2024</time><h3>Girl Powered 5.0</h3><p>More than 150 students explore robotics, coding, AI, VR and IoT in Accra.</p></li>
      <li><time datetime="2025-01">January 2025</time><h3>Rural STEAM center</h3><p>With Dreamers Wish Foundation, we launch a center for robotics, coding, AR/VR, AI, electronics and vocational skills.</p></li>
      <li><time datetime="2026-02">February 2026</time><h3>AIRTAD'26 champions</h3><p>Labone SHS, a team we sponsor, wins the AIRTAD'26 senior high robotics competition.</p></li>
    </ol>
  </div>
</section>
""" + cta_band("Help us reach the next district.", "Each new district starts with trained teachers and a set of robotics kits. Your gift makes the first step possible.")

BOARD = page_hero(
    "Board & staff",
    "The people behind Bountiful STEM",
    "Our founders, board and team in Ghana and the United States share one goal: equal access to STEM for every child.",
    "Board & Staff",
) + f"""
<section class="section">
  <div class="wrap">
    {section_head("Leadership", "Founders")}
    <div class="grid grid-2">
      <article class="card person">
        <div class="avatar" aria-hidden="true">SA</div>
        <div class="stack">
          <h3>Seth Ogoe Ayim, PMP</h3>
          <p class="tag">Co-founder &amp; Executive Director</p>
          <p>Seth leads our programs in Ghana. He is also co-founder and CEO of Bountiful Technologies Ltd, an education technology company supporting K-12 STEM, AI, robotics, IoT, VR and computer science across Ghana and West Africa. He led Ghana's first elementary and middle school VEX IQ teams to the World Championship and spoke on STEM in Ghanaian classrooms at the 2024 VEX Robotics Educators Conference.</p>
          <p class="card-link"><a href="https://www.linkedin.com/in/seth-ogoe-ayim-pmp-mpa-macs-cp-ip3-citip-stem-expert-9962b529/" rel="noopener" target="_blank">{LINKEDIN_ICON} LinkedIn profile</a></p>
        </div>
      </article>
      <article class="card person">
        <div class="avatar" aria-hidden="true">TC</div>
        <div class="stack">
          <h3>Tom Campbell</h3>
          <p class="tag">Co-founder &amp; President</p>
          <p>Tom has served as co-founder and president of Bountiful STEM Educational Foundation since 2019, guiding the foundation's work in the United States and its partnerships with donors and schools.</p>
          <p class="card-link"><a href="https://www.linkedin.com/in/tom-campbell-3847057/" rel="noopener" target="_blank">{LINKEDIN_ICON} LinkedIn profile</a></p>
        </div>
      </article>
    </div>
  </div>
</section>

<section class="section section-tint">
  <div class="wrap split">
    <div class="stack">
      <p class="eyebrow">Board of directors</p>
      <h2>Consider joining our board</h2>
      <p>We are growing our board with people who bring experience in education, engineering, finance, fundraising and nonprofit leadership, in the US or in Ghana. Board members guide our strategy, open doors to partners and help us stay accountable to donors.</p>
      <div class="btn-row"><a class="btn btn-brand" href="contact.html?topic=board">Ask about board service</a></div>
    </div>
    <div class="stack">
      <p class="eyebrow">Our team in Ghana</p>
      <h2>Teachers, coaches and mentors</h2>
      <p>Our Accra team trains teachers, coaches competition teams and runs workshops, supported by volunteers from Ghana's universities and STEM professionals around the world.</p>
      <div class="btn-row"><a class="btn btn-ghost" href="get-involved.html#volunteer">Volunteer with us</a></div>
    </div>
  </div>
</section>
"""

REPORTS = page_hero(
    "Reports & financials",
    "Accountable to every donor",
    "We are a registered US 501(c)(3) public charity. Here is where to find our filings and how to request our reports.",
    "Reports & Financials",
) + f"""
<section class="section">
  <div class="wrap grid grid-3">
    <article class="card"><div class="icon">{ICONS['flag']}</div><h3>501(c)(3) status</h3><p>Bountiful STEM Educational Foundation is a tax-exempt public charity under section 501(c)(3) of the US Internal Revenue Code. EIN {SITE['ein']}.</p></article>
    <article class="card"><div class="icon">{ICONS['link']}</div><h3>Public filings</h3><p>Our IRS filings and nonprofit profile are publicly available through independent charity databases.</p><p class="card-link"><a href="https://www.charitynavigator.org/ein/872018269" rel="noopener" target="_blank">Charity Navigator profile ↗</a></p></article>
    <article class="card"><div class="icon">{ICONS['teacher']}</div><h3>Annual reports</h3><p>Our annual reports describe the students reached, teachers trained and how every dollar was spent. Email us to request the latest copy.</p><p class="card-link"><a href="contact.html?topic=general">Request a report →</a></p></article>
  </div>
</section>
<section class="section section-tint">
  <div class="wrap split">
    <div class="stack">
      <h2>Where your money goes</h2>
      <p>Your gift pays for the things that put STEM in children's hands: robotics kits and spare parts, teacher training, competition registration and travel, and the running of our STEM centers in Ghana.</p>
    </div>
    <div class="stack">
      <h2>Tax receipts</h2>
      <p>Every donor receives a receipt for their records. Gifts from US taxpayers are tax-deductible to the extent allowed by law. Contact us if you need a duplicate receipt or a year-end statement.</p>
    </div>
  </div>
</section>
"""

PROGRAMS = page_hero(
    "Programs",
    "Hands-on STEM, from a child's first robot to the world stage",
    "Six connected programs train teachers, equip schools and give students ages 5–18 a clear path from curiosity to competition.",
    "Programs",
) + f"""
<section class="section">
  <div class="wrap grid grid-2">
    <article class="card" id="clubs">
      <div class="icon">{ICONS['robot']}</div>
      <h3>School STEM &amp; Robotics Clubs</h3>
      <p>After-school clubs in rural schools where students design, build and code robots using VEX IQ and VEX V5 systems. Clubs meet weekly and are led by teachers we have trained.</p>
      <ul class="checklist"><li>Robotics kits and curriculum provided</li><li>Coding, design thinking and teamwork</li><li>Clubs feed into local and national competitions</li></ul>
    </article>
    <article class="card" id="teachers">
      <div class="icon">{ICONS['teacher']}</div>
      <h3>Teacher Professional Development</h3>
      <p>Practical training that equips teachers to teach robotics, coding and science through projects. Our first cohort trained in Abomosu, Atiwa West District, in 2019–2020.</p>
      <ul class="checklist"><li>Hands-on workshops, not lectures</li><li>Ready-to-use lesson plans</li><li>Ongoing coaching after training</li></ul>
    </article>
    <article class="card" id="girl-powered">
      <div class="icon">{ICONS['girl']}</div>
      <h3>Girl Powered STEM Workshop</h3>
      <p>An annual workshop for students ages 5–18 with a focus on girls, held around the International Day of the Girl Child. Participants try robotics, coding, artificial intelligence, virtual reality and the Internet of Things, then meet women working in STEM careers.</p>
      <ul class="checklist"><li>Six editions held so far</li><li>150+ participants at the 2024 edition</li><li>Supported by VEX Robotics and the REC Foundation</li></ul>
    </article>
    <article class="card" id="bootcamp">
      <div class="icon">{ICONS['camp']}</div>
      <h3>Future Engineers BootCamp</h3>
      <p>A holiday bootcamp where students take on real engineering challenges, such as designing earthquake-resistant structures, and finish with the Ultimate Robot Challenge competition.</p>
      <ul class="checklist"><li>Project-based engineering design</li><li>Team challenges and a final competition</li><li>2026 registration is open</li></ul>
    </article>
    <article class="card" id="competitions">
      <div class="icon">{ICONS['trophy']}</div>
      <h3>Robotics Competitions</h3>
      <p>We prepare and sponsor teams for the VEX IQ Robotics Competition (elementary and middle school) and the VEX V5 Robotics Competition (high school), from school events to the Ghana National Championship and beyond.</p>
      <ul class="checklist"><li>Ghanaian teams at VEX Worlds in 2022, 2023, 2024 and 2026</li><li>Labone SHS, a team we sponsor, won AIRTAD'26</li><li>Travel support for students who could not otherwise go</li></ul>
    </article>
    <article class="card" id="centers">
      <div class="icon">{ICONS['center']}</div>
      <h3>STEM Centers &amp; Equipment</h3>
      <p>We set up community STEM centers and equip schools with robotics kits, computers and learning software. Our STEM center is in Weija, Accra, and in 2025 we opened a rural STEAM center with Dreamers Wish Foundation.</p>
      <ul class="checklist"><li>Robotics, coding, AR/VR, AI and electronics</li><li>Donated computers become coding labs</li><li><a href="locations.html">See our locations</a></li></ul>
    </article>
  </div>
</section>

<section class="section section-tint">
  <div class="wrap">
    {section_head("For schools and districts", "How a school joins the program")}
    <ol class="steps">
      <li><h3>Reach out</h3><p>A head teacher or district office contacts us with the school's location and number of students.</p></li>
      <li><h3>Train teachers</h3><p>Two or more teachers complete our hands-on robotics and coding training.</p></li>
      <li><h3>Launch the club</h3><p>We provide kits and curriculum, and the school starts weekly STEM club sessions.</p></li>
      <li><h3>Compete and grow</h3><p>Students enter competitions, and strong clubs become hubs for nearby schools.</p></li>
    </ol>
    <div class="btn-row" style="margin-top:1.5rem"><a class="btn btn-brand" href="contact.html?topic=school">Bring STEM to your school</a></div>
  </div>
</section>
""" + cta_band("Sponsor a team's journey.", "Kits, training, registration and travel add up. Sponsoring a team gives students a fair shot at the world stage.")

LOCATIONS = page_hero(
    "Locations",
    "Where we work",
    "Our programs reach students in Greater Accra and rural districts of Ghana, supported by our office in Utah.",
    "Locations",
) + f"""
<section class="section">
  <div class="wrap grid grid-2">
    <article class="card location">
      <div class="icon">{ICONS['pin']}</div>
      <p class="tag">Greater Accra Region, Ghana</p>
      <h3>Accra STEM Center &amp; Program Office</h3>
      <p>Weija, Accra. Home of our Ghana team, teacher training, the Girl Powered STEM Workshop, Future Engineers BootCamp and competition team practice.</p>
      <p class="card-link"><a href="contact.html?topic=school">Visit or enroll <span aria-hidden="true">→</span></a></p>
    </article>
    <article class="card location">
      <div class="icon">{ICONS['pin']}</div>
      <p class="tag">Eastern Region, Ghana</p>
      <h3>Atiwa West District School Clubs</h3>
      <p>Our first district partnership, started in Abomosu in 2019. School STEM and robotics clubs run across the district's six education circuits.</p>
      <p class="card-link"><a href="news.html#atiwa-west">Read the story <span aria-hidden="true">→</span></a></p>
    </article>
    <article class="card location">
      <div class="icon">{ICONS['pin']}</div>
      <p class="tag">Rural Ghana</p>
      <h3>Rural STEAM Center</h3>
      <p>Opened in 2025 with Dreamers Wish Foundation, offering robotics, coding, AR/VR, AI, electronics and vocational skills to students in a rural community.</p>
      <p class="card-link"><a href="news.html#dreamers-wish">Read the story <span aria-hidden="true">→</span></a></p>
    </article>
    <article class="card location">
      <div class="icon">{ICONS['pin']}</div>
      <p class="tag">Utah, United States</p>
      <h3>US Office</h3>
      <p>Washington, Utah. Our US 501(c)(3) home, where we work with donors, volunteers, corporate partners and the board.</p>
      <p class="card-link"><a href="contact.html">Contact us <span aria-hidden="true">→</span></a></p>
    </article>
  </div>
</section>
""" + cta_band("Help us open the next STEM center.", "Our goal is a STEM center within reach of every rural community we serve.")

EVENTS_PAGE = page_hero(
    "Events",
    "Workshops, bootcamps and competitions",
    "Join a workshop, cheer on a team, or support an event as a sponsor or volunteer.",
    "Events",
) + f"""
<section class="section">
  <div class="wrap">
    {section_head("Upcoming", "Events and registration")}
    <div class="grid grid-3">{event_cards(EVENTS)}</div>
  </div>
</section>
<section class="section section-tint">
  <div class="wrap split" style="align-items:start">
    <div class="stack">
      <p class="eyebrow">Our year</p>
      <h2>Annual calendar</h2>
      <p>Most of our events happen at the same time each year, so schools and sponsors can plan ahead.</p>
    </div>
    <ol class="timeline">
      <li><time>February</time><h3>Competition season</h3><p>School teams compete in Ghana's robotics competitions, such as AIRTAD.</p></li>
      <li><time>April</time><h3>VEX Robotics World Championship</h3><p>Qualifying Ghanaian teams compete with the world's best. 2026 was held in St. Louis, Missouri.</p></li>
      <li><time>School holidays</time><h3>Future Engineers BootCamp</h3><p>Engineering challenges and the Ultimate Robot Challenge.</p></li>
      <li><time>October</time><h3>Girl Powered STEM Workshop</h3><p>Held around the International Day of the Girl Child.</p></li>
      <li><time>December</time><h3>VEX Robotics Ghana National Championship</h3><p>Top teams qualify for the next World Championship.</p></li>
    </ol>
  </div>
</section>
<section class="section">
  <div class="wrap split">
    <div class="stack">
      <h2>Host an event for us</h2>
      <p>Schools, churches, companies and clubs host dinners, fun runs and robotics demos to raise money for our students. We'll help you plan it.</p>
      <div class="btn-row"><a class="btn btn-brand" href="get-involved.html#fundraiser">Plan a fundraiser</a></div>
    </div>
    <div class="stack">
      <h2>Sponsor an event</h2>
      <p>Event sponsors are thanked on stage, on our website and on LinkedIn, and can bring employees to volunteer as judges and mentors.</p>
      <div class="btn-row"><a class="btn btn-ghost" href="contact.html?topic=partnership">Become a sponsor</a></div>
    </div>
  </div>
</section>
"""

NEWS = page_hero(
    "News",
    "What's happening at Bountiful STEM",
    "Competition results, workshop recaps and partnership news from our team in Ghana.",
    "News",
) + f"""
<section class="section">
  <div class="wrap news-layout">
    <div class="stack-lg">{news_list(NEWS_ITEMS)}</div>
    <aside class="stack news-aside">
      <div class="card">
        <h3>Follow us on LinkedIn</h3>
        <p>We post competition results, workshop photos and partner news on LinkedIn first.</p>
        <p><a class="btn btn-brand" href="{SITE['linkedin']}" rel="noopener" target="_blank">{LINKEDIN_ICON} Follow</a></p>
      </div>
      <div class="card">
        <h3>Watch our videos</h3>
        <p>See our students compete at the national and world championships.</p>
        <p><a class="btn btn-ghost" href="videos.html">{YOUTUBE_ICON} Videos</a></p>
      </div>
    </aside>
  </div>
</section>
""" + cta_band("Want stories like these to keep coming?", "Monthly donors give us steady support to plan programs a full year ahead.")

VIDEOS_PAGE = page_hero(
    "Videos",
    "Watch our students build, code and compete",
    "Videos from Ghana's robotics competitions and the VEX Robotics World Championship.",
    "Videos",
) + f"""
<section class="section">
  <div class="wrap grid grid-videos">
    {"".join(video(*v) for v in VIDEOS)}
    <article class="card">
      <div class="icon">{ICONS['teacher']}</div>
      <h3>Keynote: The impact of STEM in Ghanaian classrooms</h3>
      <p>Our co-founder Seth Ogoe Ayim presents research on STEM learning in Ghana at the 2024 VEX Robotics Educators Conference.</p>
      <p class="card-link"><a href="https://pd.vex.com/videos/keynotes/enhancing-learning-and-innovation-the-impact-of-stem-in-ghanaian-classrooms" rel="noopener" target="_blank">Watch on VEX PD+ <span aria-hidden="true">↗</span></a></p>
    </article>
  </div>
</section>
<section class="section section-tint">
  <div class="wrap btn-row" style="justify-content:center">
    <a class="btn btn-brand" href="{youtube_href()}">{YOUTUBE_ICON} Subscribe on YouTube</a>
    <a class="btn btn-ghost" href="{SITE['linkedin']}" rel="noopener" target="_blank">{LINKEDIN_ICON} Follow on LinkedIn</a>
  </div>
</section>
""" + cta_band("Help the next team reach the world stage.", "Your gift covers kits, coaching and travel for students who could never afford them.")

FAQS = [
    ("Is my donation tax-deductible?", f"Yes, for US taxpayers. Bountiful STEM Educational Foundation is a registered 501(c)(3) public charity (EIN {SITE['ein']}). Gifts are tax-deductible to the extent allowed by law, and we send a receipt for every donation."),
    ("Where does my money go?", "Your gift funds robotics kits, teacher training, competition registration and travel, and the running of our STEM centers in Ghana."),
    ("Can I give every month?", "Yes. Monthly gifts let us plan programs a full year ahead. Choose the monthly option when you give online, or contact us to set one up."),
    ("Does my employer match gifts?", "Many companies match employee donations. Ask your HR team and give them our name and EIN."),
    ("Can I donate used computers or tablets?", "Yes. Working laptops, desktops and tablets are welcome. Email us with the type and number of devices and we will arrange collection."),
    ("Can I volunteer from outside Ghana?", "Yes. Engineers, teachers and STEM professionals can mentor students and teachers online, and some volunteers join us in person for workshops and competitions."),
]

FAQ_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQS
    ],
}

GIVE_BUTTON = (
    f'<a class="btn btn-gold" href="{SITE["donate_url"]}" rel="noopener" target="_blank">Give online</a>'
    if SITE["donate_url"]
    else '<a class="btn btn-gold" href="contact.html?topic=donation">Give now</a>'
)

DONATE = page_hero(
    "Ways to give",
    "Give a child in Ghana the tools to build the future",
    f"Every gift supports students and teachers in rural and underserved communities. We are a US 501(c)(3) nonprofit, EIN {SITE['ein']}.",
    "Donate",
) + f"""
<section class="section">
  <div class="wrap">
    {section_head("Your gift at work", "Choose your impact")}
    {giving_grid()}
    <p class="fineprint" style="margin-top:1rem">Amounts show examples of what gifts help fund. Your gift supports wherever the need is greatest.</p>
    <div class="btn-row" style="margin-top:1.5rem">{GIVE_BUTTON}<a class="btn btn-ghost" href="contact.html?topic=donation">Set up a monthly gift</a></div>
  </div>
</section>

<section class="section section-tint">
  <div class="wrap">
    {section_head("More ways to give", "Find the way that works for you")}
    <div class="grid grid-3">
      {card("heart", "Monthly giving", "Become a monthly donor and give students steady support all year.", ("Start monthly", "contact.html?topic=donation"))}
      {card("hands", "Employer matching", "Double your gift. Many employers match donations to 501(c)(3) charities.", ("Ask us for details", "contact.html?topic=donation"))}
      {card("link", "Sponsor a team", "Cover a competition team's kits, coaching, registration and travel.", ("Sponsor a team", "contact.html?topic=partnership"))}
      {card("laptop", "Donate equipment", "Give working computers, tablets or robotics kits to rural classrooms.", ("Donate equipment", "get-involved.html#equipment"))}
      {card("flag", "Plan a fundraiser", "Rally friends, classmates or coworkers around our mission.", ("Get started", "get-involved.html#fundraiser"))}
      {card("center", "Fund a STEM center", "Major gifts and foundation grants help open new community STEM centers.", ("Talk to us", "contact.html?topic=partnership"))}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    {section_head("Questions", "Frequently asked questions")}
    <div>{"".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in FAQS)}</div>
  </div>
</section>
"""

GET_INVOLVED = page_hero(
    "Get involved",
    "There's a place for everyone at Bountiful STEM",
    "Volunteer your skills, bring your company on board, run a fundraiser or donate equipment. Every way you help reaches a real classroom in Ghana.",
    "Get Involved",
) + f"""
<section class="section" id="volunteer">
  <div class="wrap split" style="align-items:start">
    <div class="stack">
      <p class="eyebrow">Volunteer</p>
      <h2>Share your skills with young engineers</h2>
      <p>Engineers, teachers, university students and STEM professionals help our students and teachers in person in Ghana and online from anywhere.</p>
      <div class="btn-row"><a class="btn btn-brand" href="contact.html?topic=volunteer">Sign up to volunteer</a></div>
    </div>
    <ul class="checklist">
      <li><strong>Online mentor.</strong> Coach a robotics team or a teacher over video calls.</li>
      <li><strong>Competition judge or referee.</strong> Help run the Ghana National Championship and local events.</li>
      <li><strong>Workshop volunteer.</strong> Lead a session at Girl Powered or the Future Engineers BootCamp.</li>
      <li><strong>Career speaker.</strong> Tell students how you got into STEM.</li>
      <li><strong>Skilled volunteer.</strong> Help with design, video, grant writing or fundraising.</li>
    </ul>
  </div>
</section>

<section class="section section-tint" id="corporate">
  <div class="wrap split" style="align-items:start">
    <div class="stack">
      <p class="eyebrow">Corporate partners</p>
      <h2>Partner with us to grow Ghana's STEM talent</h2>
      <p>Companies and foundations help us train teachers, equip schools and send teams to compete. We report back on the results of every partnership.</p>
      <div class="btn-row"><a class="btn btn-brand" href="contact.html?topic=partnership">Become a partner</a></div>
    </div>
    <ul class="checklist">
      <li><strong>Sponsor a school club</strong> for a year of kits, training and coaching.</li>
      <li><strong>Sponsor a team</strong> on its journey to the VEX Robotics World Championship.</li>
      <li><strong>Sponsor an event</strong> such as Girl Powered or the National Championship.</li>
      <li><strong>Employee volunteering</strong> as mentors, judges and speakers.</li>
      <li><strong>In-kind gifts</strong> of computers, software and robotics equipment.</li>
    </ul>
  </div>
</section>

<section class="section" id="fundraiser">
  <div class="wrap">
    {section_head("Plan a fundraiser", "Ideas for creating your own fundraiser", "Rally your friends, school or workplace. Tell us your plan and we'll send photos, stories and a donation link to share.")}
    <div class="grid grid-4">
      <article class="card"><h3>Birthday fundraiser</h3><p>Ask friends to give to Bountiful STEM instead of gifts, on Facebook, LinkedIn or by email.</p></article>
      <article class="card"><h3>School robotics drive</h3><p>Students in the US raise money so students in Ghana can build their first robots.</p></article>
      <article class="card"><h3>Workplace giving</h3><p>Run a giving week at work and ask your employer to match what your team raises.</p></article>
      <article class="card"><h3>Run, walk or demo day</h3><p>Host a fun run, a robotics demo or a community dinner with a short program about our students.</p></article>
    </div>
    <div class="btn-row" style="margin-top:1.5rem"><a class="btn btn-brand" href="contact.html?topic=fundraiser">Tell us your plan</a></div>
  </div>
</section>

<section class="section section-tint" id="equipment">
  <div class="wrap split">
    <div class="stack">
      <p class="eyebrow">Donate equipment</p>
      <h2>Your old laptop can become a coding lab</h2>
      <p>We accept working laptops, desktops and tablets, plus robotics kits, sensors and electronics components. Tell us what you have and we'll arrange collection and shipping to Ghana.</p>
      <div class="btn-row"><a class="btn btn-brand" href="contact.html?topic=equipment">Offer equipment</a></div>
    </div>
    <ul class="checklist">
      <li>Laptops and desktops less than about 8 years old, in working order</li>
      <li>Tablets with chargers</li>
      <li>VEX IQ and VEX V5 kits, parts and controllers</li>
      <li>Sensors, microcontrollers and electronics kits</li>
    </ul>
  </div>
</section>
"""

CONTACT = page_hero(
    "Contact",
    "Let's talk about bringing STEM to more children",
    "Whether you want to give, partner, volunteer or bring a program to your school, we'd love to hear from you.",
    "Contact",
) + f"""
<section class="section">
  <div class="wrap split" style="align-items:start">
    <div class="stack-lg">
      <ul class="contact-list">
        <li><strong>Email</strong><span data-copy-text>{SITE['email']}</span><button class="copy-btn" type="button" data-copy>Copy</button></li>
        <li><strong>Ghana office &amp; STEM center</strong>{SITE['office_gh']}</li>
        <li><strong>US office</strong>{SITE['office_us']}<br>501(c)(3) nonprofit · EIN {SITE['ein']}</li>
        <li><strong>Follow us</strong><span class="contact-social">{social_links()}</span></li>
      </ul>
      <p class="fineprint">We usually reply within two working days.</p>
    </div>
    <form class="form" id="contact-form" data-email="{SITE['email']}" novalidate>
      <div class="field"><label for="cf-name">Your name</label><input id="cf-name" name="name" autocomplete="name" required></div>
      <div class="field"><label for="cf-email">Email address</label><input id="cf-email" name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="cf-topic">I'm interested in</label>
        <select id="cf-topic" name="topic">
          <option value="general">A general question</option>
          <option value="donation">Making a donation</option>
          <option value="equipment">Donating equipment</option>
          <option value="partnership">Partnering or sponsoring</option>
          <option value="volunteer">Volunteering or mentoring</option>
          <option value="fundraiser">Planning a fundraiser</option>
          <option value="school">Bringing a program to my school</option>
          <option value="events">Events and registration</option>
          <option value="board">Joining the board</option>
        </select>
      </div>
      <div class="field"><label for="cf-message">Message</label><textarea id="cf-message" name="message" required></textarea></div>
      <button class="btn btn-brand" type="submit">Send message</button>
      <p class="form-status" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>
"""

NOT_FOUND = page_hero(
    "Page not found",
    "This page has moved or no longer exists",
    "Our website has been rebuilt. Try one of the links below.",
) + """
<section class="section">
  <div class="wrap btn-row">
    <a class="btn btn-brand" href="index.html">Go to the home page</a>
    <a class="btn btn-ghost" href="programs.html">See our programs</a>
    <a class="btn btn-ghost" href="news.html">Read the news</a>
  </div>
</section>
"""

PAGES = [
    {"file": "index.html", "nav": "index.html", "priority": "1.0",
     "title": "Bountiful STEM Educational Foundation | Robotics & STEM for Ghana",
     "description": "Bountiful STEM Educational Foundation gives children in rural Ghana equal access to robotics, coding, AI and computer science. Donate, volunteer or partner with us.",
     "schema": [ORG_SCHEMA, WEBSITE_SCHEMA], "body": HOME},
    {"file": "about.html", "nav": "about.html", "priority": "0.8",
     "title": "About Us | Bountiful STEM Educational Foundation",
     "description": "Founded in Ghana in 2019 and a US 501(c)(3) since 2021, Bountiful STEM trains teachers and equips rural schools with robotics and STEM. Our mission, story and milestones.",
     "schema": [breadcrumb("About", "about.html")], "body": ABOUT},
    {"file": "board-staff.html", "nav": "board-staff.html", "priority": "0.6",
     "title": "Board & Staff | Bountiful STEM Educational Foundation",
     "description": "Meet the founders and team of Bountiful STEM Educational Foundation, and learn about joining our board.",
     "schema": [breadcrumb("Board & Staff", "board-staff.html")], "body": BOARD},
    {"file": "reports.html", "nav": "reports.html", "priority": "0.5",
     "title": "Reports & Financials | Bountiful STEM Educational Foundation",
     "description": "501(c)(3) status, EIN 87-2018269, public filings and annual reports for Bountiful STEM Educational Foundation.",
     "schema": [breadcrumb("Reports & Financials", "reports.html")], "body": REPORTS},
    {"file": "programs.html", "nav": "programs.html", "priority": "0.9",
     "title": "STEM & Robotics Programs in Ghana | Bountiful STEM",
     "description": "School robotics clubs, teacher training, the Girl Powered STEM Workshop, Future Engineers BootCamp, VEX robotics competitions and STEM centers in Ghana.",
     "schema": [breadcrumb("Programs", "programs.html")], "body": PROGRAMS},
    {"file": "locations.html", "nav": "locations.html", "priority": "0.6",
     "title": "Locations | Bountiful STEM Educational Foundation",
     "description": "Our Accra STEM center in Weija, school clubs in Atiwa West District, a rural STEAM center in Ghana and our US office in Utah.",
     "schema": [breadcrumb("Locations", "locations.html")], "body": LOCATIONS},
    {"file": "events.html", "nav": "events.html", "priority": "0.7",
     "title": "Events | Bountiful STEM Educational Foundation",
     "description": "Future Engineers BootCamp 2026 registration, the Girl Powered STEM Workshop, the VEX Robotics Ghana National Championship and our annual calendar.",
     "schema": [breadcrumb("Events", "events.html")], "body": EVENTS_PAGE},
    {"file": "news.html", "nav": "news.html", "priority": "0.7",
     "title": "News | Bountiful STEM Educational Foundation",
     "description": "Robotics competition results, Girl Powered Workshop recaps and partnership news from Bountiful STEM in Ghana.",
     "schema": [breadcrumb("News", "news.html")], "body": NEWS},
    {"file": "videos.html", "nav": "videos.html", "priority": "0.6",
     "title": "Videos | Bountiful STEM Educational Foundation",
     "description": "Watch Ghanaian students compete at the VEX Robotics World Championship and Ghana National Championship.",
     "schema": [breadcrumb("Videos", "videos.html")], "body": VIDEOS_PAGE},
    {"file": "donate.html", "nav": "donate.html", "priority": "0.9",
     "title": "Donate | Bountiful STEM Educational Foundation",
     "description": "Make a tax-deductible gift to our 501(c)(3) and give children in rural Ghana robotics kits, trained teachers and a shot at the world stage.",
     "schema": [breadcrumb("Donate", "donate.html"), FAQ_SCHEMA], "body": DONATE},
    {"file": "get-involved.html", "nav": "get-involved.html", "priority": "0.8",
     "title": "Volunteer, Partner & Fundraise | Bountiful STEM",
     "description": "Volunteer as a mentor or judge, become a corporate partner, plan a fundraiser or donate computers to support STEM education in Ghana.",
     "schema": [breadcrumb("Get Involved", "get-involved.html")], "body": GET_INVOLVED},
    {"file": "contact.html", "nav": "contact.html", "priority": "0.6",
     "title": "Contact Us | Bountiful STEM Educational Foundation",
     "description": "Contact Bountiful STEM Educational Foundation in Accra, Ghana, or Utah, USA, about donations, partnerships, volunteering or bringing STEM to your school.",
     "schema": [breadcrumb("Contact", "contact.html")], "body": CONTACT},
    {"file": "404.html", "nav": "", "noindex": True,
     "title": "Page Not Found | Bountiful STEM",
     "description": "The page you were looking for could not be found.", "body": NOT_FOUND},
]


def main():
    for p in PAGES:
        out = head(p) + header(p["nav"]) + p["body"] + footer()
        (ROOT / p["file"]).write_text(out, encoding="utf-8")
    # impact.html was merged into about.html#impact
    if (ROOT / "impact.html").exists():
        (ROOT / "impact.html").unlink()
    today = date.today().isoformat()
    urls = "".join(
        f"  <url><loc>{SITE['url']}/{'' if p['file'] == 'index.html' else p['file']}</loc><lastmod>{today}</lastmod><priority>{p['priority']}</priority></url>\n"
        for p in PAGES if not p.get("noindex")
    )
    (ROOT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n',
        encoding="utf-8",
    )
    print("Built", len(PAGES), "pages + sitemap.xml")


if __name__ == "__main__":
    main()
