# Bountiful STEM Educational Foundation website

New site for **www.bountifulstem.org**. Plain HTML/CSS/JS with no database or plugins, so it is fast on mobile data, cheap to host and hard to hack.

## Structure

The layout follows the Boys & Girls Clubs of Utah County site (bgcutah.org): a top bar with contact and social links, dropdown menus, a homepage built around programs, "your gift at work" giving levels, events, news and ways to get involved, and a donate button on every page.

| Menu | File | Purpose |
|---|---|---|
| Home | `index.html` | Mission, programs, giving levels, impact, featured video, events, news, get involved, partners |
| About → Who We Are | `about.html` | Mission, vision, story, values, milestones (`#impact`) |
| About → Board & Staff | `board-staff.html` | Founders, joining the board, Ghana team |
| About → Reports & Financials | `reports.html` | 501(c)(3) status, filings, annual reports, tax receipts |
| Programs | `programs.html` | Six programs plus how a school joins |
| Locations | `locations.html` | Accra STEM center, Atiwa West, rural STEAM center, US office |
| Get Involved | `get-involved.html` | Volunteer, Corporate Partners, Plan a Fundraiser, Donate Equipment |
| Events | `events.html` | Upcoming events and annual calendar |
| News | `news.html` | News stories plus LinkedIn follow box |
| Videos | `videos.html` | YouTube videos and the VEX keynote |
| Contact | `contact.html` | Contact details, social links, enquiry form |
| Donate | `donate.html` | Giving levels, more ways to give, FAQ |

## Before you go live (checklist)

All settings are at the top of `_build/build.py`. Rebuild after any edit with `python3 _build/build.py`.

1. **Logo.** Replace `assets/img/logo.svg` and `assets/img/favicon.svg` with your real logo (keep the file names). If your logo colors differ, change the four brand colors at the top of `assets/css/style.css` (`--brand`, `--brand-ink`, `--grow`, `--gold`).
2. **Giving levels (`GIVING_LEVELS`).** The amounts ($15 to $1,500) and what each one funds are **examples**. Replace them with your real costs before launch.
3. **Donate link (`donate_url`).** Paste your PayPal, Givebutter or Donorbox link. Until then, "Give now" opens the contact form.
4. **LinkedIn (`linkedin`).** Set to `linkedin.com/company/bountiful-stem-educational-foundation`. Open it to confirm it's your page, and correct it if not.
5. **YouTube (`youtube`).** Paste your channel URL. Until then, the YouTube icon opens the Videos page.
6. **Videos (`VIDEOS`).** Three videos are included. To add one, copy the ID after `watch?v=` in the YouTube link and add a line.
7. **Email (`email`).** Currently `info@bountifulstemeducationalfoundation.org`, found on your old site.
8. **People.** Confirm the titles for Seth Ogoe Ayim (Co-founder & Executive Director) and Tom Campbell (Co-founder & President). Add other board and staff members, and replace the initials with photos.
9. **Recent news to confirm:** Labone SHS's AIRTAD'26 win "as a team we sponsor" and teams attending 2026 VEX Worlds in St. Louis (both from your LinkedIn posts), and Girl Powered 6.0 on October 25, 2025.
10. **Numbers.** Check 2,000+ students, GH₵60k+ kits, 150+ workshop participants and "4 yrs" at Worlds (2022, 2023, 2024, 2026).
11. **Photos.** Real photos of students would make the biggest difference. Add them to `assets/img/`.
12. **Contact form.** By default it opens the visitor's email app. To receive messages directly, create a free form at formspree.io and add `data-endpoint="https://formspree.io/f/XXXX"` to the `<form>` in the `CONTACT` section.

## Hosting

Upload everything except `_build/` and `README.md` to any static host. Free options that suit nonprofits: **Netlify**, **Cloudflare Pages** or **GitHub Pages**. Point the `www.bountifulstem.org` domain at the host and redirect `bountifulstem.org` to `https://www.bountifulstem.org`.

Set up redirects from old WordPress URLs so existing Google links keep working, for example:

```
/about-us/          → /about.html
/donations/         → /donate.html
/events/            → /events.html
/2020/*             → /news.html
/2024/*             → /news.html
/2025/*             → /news.html
/category/*         → /news.html
/sample-page/       → /
```

On Netlify this goes in a `_redirects` file; on Cloudflare Pages too. Use 301 (permanent) redirects.

## Getting found on Google

What is built in:
- A unique title and description on every page, written around searches like "STEM education Ghana", "robotics programs Ghana" and "donate STEM Ghana"
- Structured data Google reads: Organization (NGO, 501(c)(3), EIN, founder, location), WebSite, Breadcrumbs and FAQ
- `sitemap.xml`, `robots.txt`, canonical URLs and Open Graph / social share images
- Mobile-first, fast pages with semantic headings, which Google uses for ranking

What you need to do after launch:
1. Go to **Google Search Console** (search.google.com/search-console), add `https://www.bountifulstem.org`, and verify ownership (the DNS option is easiest).
2. Under **Sitemaps**, submit `https://www.bountifulstem.org/sitemap.xml`.
3. Use **URL Inspection → Request indexing** for the home, programs and donate pages.
4. Create a free **Google Business Profile** for the Weija, Accra office so you appear in Maps and local results.
5. Apply for **Google for Nonprofits** (google.com/nonprofits). It includes up to $10,000/month in free Google Ads search ads.
6. Put the website link on your LinkedIn page and YouTube channel, and ask partners (Bountiful Technologies, Dreamers Wish Foundation, Reading Horizons, BYU Magazine) to link to the new site. Links from trusted sites raise ranking.
7. Post news regularly. Fresh content helps you rank.

## Important: problems found on the old site

Google's index of the old WordPress site shows **spam pages that don't belong to you**, including casino links and an unrelated article ("Coalition for Veterans in Alaska"). This usually means the WordPress site has been hacked. Please:
- Have whoever manages the hosting remove the old WordPress install, or clean it and change all passwords.
- After launching the new site, use **Search Console → Removals** to remove the spam URLs from Google.
- In Search Console, check **Security & Manual Actions** for any warnings.

## Content that was rewritten

- **Mission:** "to improve quality of teaching and learning in the rural and deprived communities using our STEM program" → "To improve the quality of teaching and learning in rural and underserved communities through hands-on STEM education." ("Deprived" reads as negative to donors; the grammar is fixed.)
- **Vision:** the old site had two different versions. Combined into one clear statement about trained teachers and STEM centers in every rural community across Ghana and West Africa.
- **News posts** (Atiwa West donation, Girl Powered workshops, Reading Horizons, Dreamers Wish, VEX Worlds) were rewritten as short, consistent stories with dates.
- **Leftover WordPress pages** ("Sample Page", empty monthly archives) were dropped.
- Spelling and style are consistent US English throughout, with Ghanaian currency shown as GH₵.
- Added content the old site lacked: values, leadership bio, how a school joins, FAQ, ways to give, and tax-deductibility details.
