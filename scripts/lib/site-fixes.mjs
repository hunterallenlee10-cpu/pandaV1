// Fixes for problems found in the site audit, applied by customize.mjs during
// 03-build.mjs (SITE_FIXES=0 turns them off). Each one is a surgical edit, so
// everything else on the page stays byte-for-byte as captured.
//
//  - Top bar: it showed "Local Weather: N/A°F | Weather Alerts: N/A" to anyone who
//    didn't grant location access (it asked for it on every page); it now shows the
//    free-estimate phone number. Same bar, same size and colour.
//  - Lead forms: "Unable to load review count" (it needs the WordPress API) becomes a
//    link to the Reviews page.
//  - Testimonials: the 2-review carousel never started (its script runs before the
//    Swiper library loads), so only the first review was visible and the arrows did
//    nothing; the reviews beside the video on / and /services/ sat below a large empty
//    band. Every one of them is now the same looping review carousel (reviews.mjs,
//    custom/reviews/); the section is removed from Service Areas.
//  - "Our Project Gallery" (8 pages): three sliders were started on the same photos, so
//    they came out at different widths, the first one cut off, off centre under the
//    tabs. It is now one gallery of same-size photos with category tabs, arrows, dots and
//    a photo viewer (project-gallery.mjs, custom/project-gallery/).
//  - "Experts You Can Trust" (home page): the logo carousel jumped one step every 2.5 s
//    (and its looped copies never loaded their logos); it is now a continuously gliding
//    row of logos.
//  - "About Our Team" / "Request an Appointment" sections: the award badges picture
//    (GAF President's Club + two Inc. 5000 badges) becomes the same badges with the
//    site's other GAF certifications (Diamond Pledge, Metal Certified) in the empty
//    space around them.
//  - Home hero: the award badges picture kept a fixed 562 px width in its 260 px column
//    between two white lines (off the right of the screen on tablets, under the form on
//    small laptops); above phone size the lines and the picture now share one width, as
//    they already did on phones.
//  - From 1120 px the page builder gives some blocks their desktop width (1143 px rows,
//    the 1198 px blog article), but the page's column stays 960 px wide up to 1200 px
//    (1140 px above), so they ran off the right of the screen (the blog text was cut
//    off) at 1120–1199 px, an iPad held sideways among others; they now stop at the
//    column's edge (so does a picture on /roofing/residential/ at 480–529 px, and long
//    words in blog posts on the smallest phones). In the same range the header's phone
//    button wrapped under the logo and the taller header covered the top of the page;
//    the header now uses the whole width there, as it fits in one row.
//  - Inc. 5000 awards section (/roofing/, /about/, /podcast/): one light band with the
//    heading, the two rankings and the badges on a white card (it was lime with white
//    swooshes running through hard-to-read white text, or plain black on white).
//  - Header "Services" menu: the "Other" entry (Siding, and Gutters with Gutter Guards one
//    level further in) is replaced by Gutters, Gutter Guards and Siding as their own entries.
//  - "About Our Team" (the lead-form block above the footer on most pages): white text on
//    Panda lime was hard to read; it now sits on a charcoal green with a lime button.
//  - /reviews/: the "Read More Reviews!" button is removed (on request).
//  - /reviews/: the one review under an old picture of the Google rating becomes the review
//    wall: the Google rating, "Write a review" links and every five-star Google review
//    (review-wall.mjs, custom/reviews/google-reviews.json).
//  - /reviews/ hero: the Google rating, reviewers' faces, a quote, "Read the reviews" and
//    "Write a review" buttons and the BBB and GAF badges over a sharp tile-roof photo (was
//    a blown-up truck photo); the forms' rating picture shows the current rating.
//  - Missing pictures (missing on the live site too): a reviewer photo becomes the
//    reviewer's initials; an Interiors gallery tile without its photo is removed (the
//    other tiles keep their size), and so are the two Commercial tiles on /gallery/ whose
//    photos are gone (they showed as empty grey boxes).
//  - A link whose href was swallowed by its style attribute is repaired; placeholder
//    phone links ("(XXX) XXX-XXXX") get the site's number.
//  - Blog share buttons did nothing (their script is missing on the live site too);
//    they are now plain share links.
//  - /service-areas/ hero: it said only "Our Service Areas" and a tagline over a blurry,
//    stretched strip of roof (a 2000x450 picture pinned to the screen). It now says where
//    Panda works, with the numbers from the US map's areas.json (jobs, states, offices),
//    has state chips that glide to the map and zoom to that state, call and map buttons,
//    and a sharp drone photo that loads first.
//  - /service-areas/ "Our Reliable Exterior Remodeling Services": four green boxes of
//    text become a gliding row of photo cards, one per service page, that eases to a
//    stop under the mouse.
//  - /about/, /podcast/, /roofing/ services carousel (under "Customer-Oriented Exterior
//    Remodeling Services…" / "Comprehensive Roofing…"): the icon cards showed only roofing,
//    twice over ("Roofing Replacement" and "Replacement" were the same page), with
//    descriptions that belonged to other cards and the third card cut off at the edge. It
//    becomes the same gliding row of photo cards (all services, or the roofing ones on
//    /roofing/), in the section's orange.
//  - Service card grids (/services/, /solar/, /siding/, /gutters/, /commercial-roofing/):
//    the same orange icon cards, standing still, become the same photo cards in a grid,
//    with each page's own titles and text. Three of their links led to pages that don't
//    exist on the main site (/powerwash/, /window-replacement/: Huntersville city-site
//    pages) or to the wrong one (siding "Siding Types" -> commercial roof types); they now
//    lead to the contact page.
//  - /siding/, /gutters/: one strong page per service, with new sections under the cards
//    (service-pages.mjs, custom/site-fixes/service-pages.json); the "Siding Types" card
//    leads to the siding types section; /gutters/ opens its gallery on the Gutters photos.
//  - Lead forms (every page with one): the same "10% OFF Roof Replacement" form everywhere,
//    sending to Salesforce (no longer used) and others and asking for the visitor's location
//    on load. Each form card now has a form for its page (the page's service, the roofing
//    offer on roofing pages, or a general one), not connected to anything yet, and the old
//    scripts are gone from every page (service-forms.mjs, custom/site-fixes/service-forms.json).
//  - /referrals/: the referral sign-up (Panda's live GetTheReferral page, laid over the
//    whole page) becomes a page that explains the referral program and links to the Panda
//    Exteriors app on the App Store and Google Play (referrals-page.mjs,
//    custom/site-fixes/referrals-page.json).
//  - Share titles (og:title, twitter:title) copied from the About page: /podcast/ and
//    /referrals/ were shared as "Panda Exteriors | About Us"; they now use the page's
//    own title.
//  - Roof repairs (Panda does not do them): /roofing/repairs/ is removed (config.mjs), and
//    so are the cards and sections about repairs and every link to the page; wording that
//    offered repairs now says what Panda does (REPAIR_COPY).
//  - "Request an Appointment" (/offers/): its paragraph was printed twice; it is shown once.
//  - The offer pages (/blog/offer/…/): the header's phone button said (877) 213-1240 (a link
//    phones can't dial) instead of the site's number; their heroes get a sharp photo and a
//    readable line under the heading (offers-page.mjs). Lists in blog posts were white on
//    white (site-fixes.css).
//  - /offers/: a new hero photo (a Panda GAF solar roof) and text, and the five flyer bands
//    become the two offers as coupon cards, what comes with every project and how to claim
//    an offer (offers-page.mjs, custom/site-fixes/offers-page.json).
//  - /past-projects/: the "Featured Projects" grid of every project (duplicate drone shots,
//    cards titled "Panda Ext-14098", photos that didn't load) becomes "Some of our favorite
//    past projects", six hand-picked jobs above the map, and the hero's soft stock photo
//    becomes a photo of Panda's crew at work (past-projects.mjs, custom/past-projects/).
//  - /about/: the hero ("About Us" over a photo of an office ceiling) introduces the company
//    over a photo of a Panda roofer, and "Our Mission" (two long paragraphs) becomes
//    a headline, three points and a photo collage (about-page.mjs).
//  - /faqs/: the hero (over bare roof decking) gets a headline, a question search and topic
//    chips over an aerial photo of a Panda solar roof, and the three question-and-panel
//    blocks become accordions grouped by topic beside a topic menu and a help card, with
//    FAQPage structured data (faq-page.mjs, custom/site-fixes/faq-page.json).
//  - /charity-and-community/: a truck photo under the heading, text-only cards and a broken
//    map become a hero with the total donated and a photo collage, the recent gifts, the
//    organizations, a wall of the gallery's community photos, the podcast and a partner
//    band (charity-page.mjs, custom/site-fixes/charity-page.json).
//  - "Limited Time Offers" (the home page, /roofing/, /solar/, /commercial-roofing/,
//    /siding/, /gutters/, /thank-you/): the flyer pictures ("Spring Savings", a number that
//    isn't the site's, "Internal Promotion" in the text) become the two offers as the
//    /offers/ page's coupon cards (offers-page.mjs).
//  - /gutters/: the hero gets gutter chips and estimate and call buttons (services-hero.mjs);
//    "Why Work with Our East Coast Exterior Specialists?" (white on lime, and promising
//    cleaning services Panda doesn't offer) becomes three icon cards (gutters-page.mjs).
//  - /gutters/gutter-guards/: the hero gets chips and estimate and call buttons over a lighter
//    photo (services-hero.mjs); the benefits (white on lime) become icon cards, with how it
//    works, questions, a band for new gutters and the offers band (gutter-guards-page.mjs).
//  - /roofing-costs/: the hero gets chips and estimate and call buttons (services-hero.mjs);
//    the lime "Quality Roof Replacements" band (white on lime) becomes what affects the cost,
//    the quality cards as icon cards, insurance roofing (what's covered, how Panda helps with
//    a claim, Panda's guides) and questions, with the offers band (roofing-costs-page.mjs).
//  - /roofing/types/: the hero gets chips for the four roof types and estimate and call buttons
//    (services-hero.mjs); the lime "Gorgeous Roofing Options" band (white on lime) becomes four
//    roof type cards, a comparison table, how to choose, why Panda and questions, with the
//    offers band and "About Our Team" on charcoal green (roofing-types-page.mjs).
//  - /roofing/: the hero gets chips for the four roofing pages and estimate and call buttons
//    (services-hero.mjs); "Our Process" (blue boxes over a faded mascot) becomes a numbered
//    timeline with estimate and call buttons on charcoal green, and "About Our Team" gets the
//    charcoal green it has on other pages (roofing-page.mjs); signs it's time for a new roof,
//    what goes into every new roof and questions go under the services (service-pages.mjs);
//    "What Makes Our Roofers Stand Out?" (lime headings on lime) becomes icon cards on Panda
//    orange (gutters-page.mjs). /commercial-roofing/ gets the same "Our Process".
//  - /services/: the hero's line named windows (not a Panda service) over a 678 KB PNG; it
//    now has a label, service chips and estimate and call buttons over a WebP copy of the
//    photo (services-hero.mjs).
//  - /contact-us/: the office cards' Google map pictures never loaded, their numbers
//    couldn't be tapped and three had no address; a hero with call, email and an office
//    map and seven cards with drawn state maps, addresses, call and directions buttons
//    replace them, and the pop-up form that could not send goes (contact-page.mjs,
//    custom/site-fixes/contact-page.json).
//  - /customer-service/: a title strip over a cropped photo and a sales block; a hero with
//    the main line, email and local offices and six help topics (warranty, guarantee,
//    financing, reviews, referrals, FAQs) replace it, and the estimate block is headed
//    "Planning a new project?" (customer-service-page.mjs).
//  - 404.html: the header and nothing under it; "Oops! That page doesn't exist.", a link
//    home, a call button and links to the main pages now sit under it (not-found-page.mjs).
//  - /terms-and-conditions/, /privacy-policy/: the text ran the full width of the screen and
//    the lists were white on white; a hero with three key points, and the text in numbered
//    sections beside an "On this page" menu (legal-page.mjs, custom/site-fixes/legal-pages.json).
//  - /gallery/: the page opened on the category tabs with no heading; a hero ("Panda
//    Exteriors Company Gallery") with the categories, numbers and a collage of the
//    gallery's own photos now sits above them (gallery-page.mjs,
//    custom/site-fixes/gallery-page.json).
//  - The blog (/blog/, its numbered pages and every post): a hero with search, topic filters,
//    a featured post and cards; posts get a title header with the cover shown whole, a
//    readable column beside a sidebar ("On this page", a free-estimate card), call-and-estimate
//    bands, share links and "Keep reading" (blog.mjs, custom/blog/).
//  - The project pages (/blog/project/…/): a title strip over full-size photos, seven with
//    no words, nine linked from nowhere but the Site Map; a hero, the story beside "At a
//    glance", a photo grid with a viewer and more projects, plus a "Recent projects" row on
//    the service pages each belongs to and every project listed on /past-projects/
//    (project-pages.mjs, custom/projects/).
//  - Typos in headings and labels.
import { collectMergedNav } from './merged-pages.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, SITE_ORIGIN, renamedPath } from './config.mjs';
import { attr, classes, hasClass, esc, textOf, rawText, clean, findAll, find, editText, textNodes, startTag, headEndOffset } from './html-edit.mjs';
import { collectReviewCarousels } from './reviews.mjs';
import { collectReviewWall, collectReviewsHero } from './review-wall.mjs';
import { collectProjectGalleries } from './project-gallery.mjs';
import { loadUsMap } from './us-map.mjs';
import { collectServicePage, servicePage } from './service-pages.mjs';
import { collectServiceForms } from './service-forms.mjs';
import { collectOffersPage, collectOfferDetailPage, collectOffersStrip } from './offers-page.mjs';
import { renderPastProjects } from './past-projects.mjs';
import { collectAboutPage } from './about-page.mjs';
import { collectFaqPage } from './faq-page.mjs';
import { collectReferralsPage } from './referrals-page.mjs';
import { collectGalleryPage } from './gallery-page.mjs';
import { collectCharityPage } from './charity-page.mjs';
import { collectContactPage, contactPage, officeMap } from './contact-page.mjs';
import { officePagePath, NEW_PAGES_ON } from './new-pages.mjs';
import { collectCustomerServicePage } from './customer-service-page.mjs';
import { collectNotFoundPage } from './not-found-page.mjs';
import { collectLegalPage } from './legal-page.mjs';
import { collectServiceHero } from './services-hero.mjs';
import { collectGuttersPage } from './gutters-page.mjs';
import { collectGutterGuardsPage } from './gutter-guards-page.mjs';
import { collectSolarPages } from './solar-pages.mjs';
import { collectRoofingCostsPage } from './roofing-costs-page.mjs';
import { collectRoofingTypesPage } from './roofing-types-page.mjs';
import { collectRoofingPage } from './roofing-page.mjs';
import { collectBlogPages } from './blog.mjs';
import { collectProjectPage, collectProjectStrip } from './project-pages.mjs';

export const SITE_FIXES_DIR = path.join(ROOT, 'custom', 'site-fixes');
export const SITE_FIXES_FILES = {
  'site-fixes.css': '/_custom/site-fixes/site-fixes.css',
  'site-fixes.js': '/_custom/site-fixes/site-fixes.js',
  // the photos of /about/'s hero and "Our Mission" (about-page.mjs)
  'about-hero.webp': '/_custom/site-fixes/about-hero.webp',
  'about-team.webp': '/_custom/site-fixes/about-team.webp',
  // the photo behind /faqs/'s hero (faq-page.mjs)
  'faq-hero.webp': '/_custom/site-fixes/faq-hero.webp',
  // the photo behind /services/'s hero (services-hero.mjs)
  'services-hero.webp': '/_custom/site-fixes/services-hero.webp',
  // the photo behind /gutters/gutter-guards/'s hero (services-hero.mjs)
  'gutter-guards-hero.webp': '/_custom/site-fixes/gutter-guards-hero.webp',
  // the photo behind /siding/'s hero (services-hero.mjs)
  'siding-hero.webp': '/_custom/site-fixes/siding-hero.webp',
  // the photo behind /commercial-roofing/'s hero (services-hero.mjs)
  'commercial-hero.webp': '/_custom/site-fixes/commercial-hero.webp',
  // the photo beside /roofing/'s "What Goes Into Every New Roof" (service-pages.mjs)
  'roofing-ridge.webp': '/_custom/site-fixes/roofing-ridge.webp',
};
// Fixes that change a whole section or message, by the start of their change note.
export const SECTION_FIXES = /^(testimonials|project gallery|hero awards picture|gallery tile|logo carousel|award badges|removed on request|service areas hero|services carousel|services grid|service page|service form|referrals page|about section colors|about heading|awards section|offers page|offer page|favorite projects|reviews page|about page|faq page|gallery page|charity page|contact page|customer service page|services page|gutters page|offers band|gutter guards page|guards page|solar page|solar-shingles page|solar shingles page|roofing costs page|costs page|roofing page|commercial roofing page|commercial page|blog listing|blog post|not found page|legal page|project page|project row)/;

// The badges shown where the award badges picture was (files already on the site): the
// three GAF certifications on top, the two Inc. 5000 awards below. The GAF President's
// Club badge and both Inc. 5000 badges are the ones in the old picture.
const AWARDS_PICTURE = /\/wp-content\/uploads\/2025\/04\/awards\.png$/;
const BADGES = [
  { src: '/wp-content/uploads/2025/04/brand-gaf-pledge.png', width: 120, height: 120, kind: 'gaf', alt: 'GAF Diamond Pledge: NDL roof guarantee' },
  { src: '/wp-content/uploads/2025/04/brand-gaf.png', width: 120, height: 120, kind: 'gaf', alt: 'GAF President’s Club: residential award winner' },
  { src: '/wp-content/uploads/2025/05/GAF-Metal-Certified-Panda-Exteriors.png', width: 120, height: 120, kind: 'gaf', alt: 'GAF Metal Certified: Timbersteel roofing contractor' },
  { src: '/wp-content/uploads/2025/04/inc-2004.png', width: 150, height: 130, kind: 'inc', alt: 'Inc. 5000 2024: No. 50 of America’s fastest-growing private companies' },
  { src: '/wp-content/uploads/2025/04/inc-1.png', width: 150, height: 130, kind: 'inc', alt: 'Inc. 5000 2024: No. 1 in construction among America’s fastest-growing private companies' },
];

// The number in the site's header on every page.
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
// The header's "Services" menu: the entries that replace "Other", in this order, under Solar.
// The Inc. 5000 awards section (/roofing/, /about/, /podcast/): the sharper picture of the
// three badges (on a white ground, so it sits on a white card) and what the badges say.
const INC_TRIO = { src: '/wp-content/uploads/2025/04/Inc-trio-768x255.png', large: '/wp-content/uploads/2025/04/Inc-trio.png', width: 768, height: 255 };
const INC_STATS = [
  ['No. 50', 'of America’s fastest-growing private companies in 2024'],
  ['No. 1', 'in construction in 2024'],
];
const SERVICE_MENU_ITEMS = [
  ['Gutters', '/gutters/'],
  ['Gutter Guards', '/gutters/gutter-guards/'],
  ['Siding', '/siding/'],
];
// The header's "Services" ▸ "Solar" entries: label, address and the line under the label
// that says what each one is (solar panels and GAF solar shingles are different products).
const SOLAR_MENU_ITEMS = [
  ['Solar Panels', '/solar/', 'Mounted on your existing roof'],
  ['GAF Solar Shingles', '/solar/gaf-solar-roof/', 'The roof itself makes power'],
];
// Where "Solar" itself leads: the page that shows both (new-pages.mjs), and its label there.
const SOLAR_OPTIONS_PATH = '/solar-options/';
const SOLAR_OPTIONS_LABEL = 'Solar Options';
// The "Solar" entry's label: as captured, and once renamed.
const SOLAR_LABELS = ['Solar', SOLAR_OPTIONS_LABEL];
// The Google rating in the lead form's rating picture (admin-ajax-2.png).
const GOOGLE_RATING = '4.9';

// /service-areas/ hero: the drone photo of the Laurel, MD office and the homes around it
// (already on the site, with a .webp copy). site-fixes.css uses the same file.
const SA_HERO_PHOTO = '/wp-content/uploads/2025/07/DJI_20250722134520_0995_D.jpg';
const SA_HERO_CHIPS = 6; // states with the most jobs, as chips; the rest are "+N more"
const SA_MAP_ID = 'service-map';
// /service-areas/ "Our Reliable Exterior Remodeling Services": one card per service page,
// with a photo the site already has for it (a .webp copy is used where there is one).
const SERVICE_CARDS = [
  { group: 'Roofing', title: 'Roof Replacement', href: '/roofing/replacement/', img: ['/wp-content/uploads/2025/04/Roof-Replacement-768x432.jpg', 768, 432],
    text: 'GAF Master Elite certified crews replace worn-out roofs quickly and stand behind the work.' },
  { group: 'Roofing', title: 'Storm Damage', href: '/storm-damage/', img: ['/wp-content/uploads/2025/04/hero-roofing.jpg', 1400, 800],
    text: 'A free storm-damage inspection, and help with your insurance claim from start to finish.' },
  { group: 'Roofing', title: 'Attic Insulation', href: '/roofing/attic-insulation/', img: ['/wp-content/uploads/2025/04/Attic-Insulation.jpg', 1200, 799],
    text: 'Environmentally friendly insulation that keeps your home comfortable all year.' },
  { group: 'Solar', title: 'Solar Panels', href: '/solar/', img: ['/wp-content/uploads/2025/03/8a443005-9df9-4777-839c-45cf7d4b9f2e-1-768x512.jpg', 768, 512],
    text: 'Solar panel systems that lower your utility bills and can qualify for tax incentives.' },
  { group: 'Solar', title: 'GAF Solar Shingles', href: '/solar/gaf-solar-roof/', img: ['/wp-content/uploads/2025/05/GAF-Solar-Shingle-Installation-1-768x432.jpg', 768, 432],
    text: 'Solar shingles that work as your roof and your power source, in one install.' },
  { group: 'Commercial', title: 'Commercial Roofing', href: '/commercial-roofing/', img: ['/wp-content/uploads/2025/04/hero-commercial-roofing.jpg', 1400, 800],
    text: 'Flat roof replacements for businesses, from inspection to final walkthrough.' },
  { group: 'Exterior', title: 'Siding', href: '/siding/', img: ['/wp-content/uploads/2025/03/Group-9560-1.png', 1450, 768],
    text: 'New siding that refreshes how your home looks and protects it from the weather.' },
  { group: 'Exterior', title: 'Gutters', href: '/gutters/', img: ['/wp-content/uploads/2025/04/Gutter-System.jpg', 1200, 800],
    text: 'Complete gutter systems that carry rainwater away from your roof and foundation.' },
  { group: 'Exterior', title: 'Gutter Guards', href: '/gutters/gutter-guards/', img: ['/wp-content/uploads/2025/04/gutter-installation-768x506.jpg', 768, 506],
    text: 'Guards that stop clogs and pests and cut down on gutter cleaning.' },
];
// The roofing pages' row: the roofing cards above plus Roof Types (which only they link).
const ROOF_TYPES_CARD = { group: 'Roofing', title: 'Roof Types', href: '/roofing/types/', img: ['/wp-content/uploads/2025/04/roofing-types-and-materials.jpg', 1200, 806],
  text: 'Asphalt shingles, metal and flat roofs, in the colors and styles that suit your home.' };
const ROOFING_CARDS = ['/roofing/replacement/', '/roofing/types/', '/storm-damage/', '/roofing/attic-insulation/', '/commercial-roofing/'].map(
  (href) => [...SERVICE_CARDS, ROOF_TYPES_CARD].find((s) => s.href === href)
);
// Service card grids: the photo for each card, by the page it links to (the same photos as
// the rows above where there is one).
const photoFor = (href) => [...SERVICE_CARDS, ROOF_TYPES_CARD].find((s) => s.href === href)?.img;
const GRID_PHOTOS = {
  '/roofing/': photoFor('/storm-damage/'),
  '/commercial-roofing/': photoFor('/commercial-roofing/'),
  '/solar/': photoFor('/solar/'),
  '/solar/solar-panel-installations/': photoFor('/solar/'),
  '/solar/gaf-solar-roof/': photoFor('/solar/gaf-solar-roof/'),
  '/siding/': photoFor('/siding/'),
  '/gutters/': photoFor('/gutters/'),
  '/gutters/gutter-guards/': photoFor('/gutters/gutter-guards/'),
  // a flat roof Panda replaced (Patient First), and a metal commercial roof
  '/commercial-roofing/roof-replacement/': ['/wp-content/uploads/2025/04/Patient-First.jpg', 1200, 675],
  '/commercial-roofing/roof-types/': ['/wp-content/uploads/2025/04/Commerical-Roofing-Project.jpg', 1000, 667],
};
// Cards whose link went nowhere (404 on the live site too) or to the wrong page: by the
// page they are on, their title and the addresses they had (live, or in an earlier build).
// Each sits on the page that covers its service (/gutters/ is gutter installations,
// /siding/ siding replacements), so those lead to the contact page; "Siding Types" leads to
// the siding types section further down its page (service-pages.mjs).
const GRID_CARD_FIXES = [
  { page: '/gutters/', title: 'Gutter Installations', from: ['/powerwash/'], href: '/contact-us/', cta: 'Get a free estimate', img: photoFor('/gutters/') },
  { page: '/siding/', title: 'Siding Replacements', from: ['/window-replacement/'], href: '/contact-us/', cta: 'Get a free estimate', img: photoFor('/siding/') },
  // The site restructure merged these cards' pages into the page they are on (MERGED_PAGES
  // in config.mjs): they lead to the sections that took in what those pages said.
  { page: '/commercial-roofing/', title: 'Roofing Replacement', from: ['/commercial-roofing/roof-replacement/', '/commerical-roofing/roof-replacement/', '/commercial-roofing/'], href: '#commercial-roof-replacement', cta: 'How we replace commercial roofs', img: GRID_PHOTOS['/commercial-roofing/roof-replacement/'] },
  { page: '/commercial-roofing/', title: 'Roofing Options', from: ['/commercial-roofing/roof-types/', '/commerical-roofing/roof-types/', '/commercial-roofing/'], href: '#commercial-roof-systems', cta: 'Compare roof systems', img: GRID_PHOTOS['/commercial-roofing/roof-types/'] },
  { page: '/siding/', title: 'Siding Types', from: ['/commercial-roofing/roof-types/', '/commerical-roofing/roof-types/', '/contact-us/'], href: '#siding-types', cta: 'Compare siding types', img: ROOF_TYPES_CARD.img },
];
const gridCardFix = (pathname, title, href) => GRID_CARD_FIXES.find((f) => f.page === pathname && f.title === title && f.from.includes(href));
// Card text that changes, by page: /commercial-roofing/'s "Roofing Options" offered GAF
// shingles, solar panels and solar shingles (the residential roofing card's words) on a page
// about flat roofs; it names the flat roof systems the page compares below.
const GRID_CARD_TEXTS = {
  '/commercial-roofing/': {
    'Roofing Options': 'As a GAF Master Elite contractor, we install TPO, EPDM, Mod Bit and PVC flat roof systems. Whether you want something affordable or the top of the range, there is a flat roof system for your building and budget.',
  },
};
const gridCardText = (pathname, title, text) => GRID_CARD_TEXTS[pathname]?.[title] || text;
const TYPOS = [
  [/\bExperts Your Can Trust\b/g, 'Experts You Can Trust'],
  [/\bExterior Modeling\b/g, 'Exterior Remodeling'],
  [/\bCommerical\b/g, 'Commercial'],
  [/\bOur Services Areas\b/g, 'Our Service Areas'],
  // footer, every page
  [/\bis a East Coast exterior remodeling company\b/g, 'is an East Coast exterior remodeling company'],
  // "Our Process" (/roofing/, /commercial-roofing/): a dropped first letter, and a missing "and"
  [/\bo matter what part of your exterior needs work\b/g, 'No matter what part of your exterior needs work'],
  [/\bworks within your schedule a budget\b/g, 'works within your schedule and budget'],
];

// Panda does not do roof repairs (small repair jobs), so the site no longer offers them:
// /roofing/repairs/ is removed (REMOVED_PAGES in config.mjs), and wording that offers
// repairs says what Panda does instead. Matched in the page source (so &nbsp; and the
// site's own apostrophes as written there).
const REPAIRS_PAGE = /^(?:https?:\/\/(?:www\.)?pandaexteriors\.com)?\/roofing\/repairs\/?(?:[?#].*)?$/;
const REPAIR_COPY = [
  // "About Our Team", on most pages
  [/From roof repairs and solar panel installations to commercial roof replacement and maintenance/g, 'From full roof replacements and solar panel installations to commercial roofing'],
  // home page, and the company description in every page's structured data
  [/Whether you need expert roof repairs, a full commercial roof replacement/g, 'Whether you need a new roof for your home, a full commercial roof replacement'],
  [/From repairs to complete roof replacements, Panda Exteriors/g, 'From free roof inspections to complete roof replacements, Panda Exteriors'],
  // /commercial-roofing/
  [/delivers expert roof repairs, replacements, and solar shingle installations/g, 'delivers expert roof replacements and solar shingle installations'],
  // /roofing/, /commercial-roofing/
  [/comprehensive repair and replacement services/g, 'comprehensive replacement and installation services'],
  // /roofing/types/
  [/Whether you need a complete replacement or a(?:\s|&nbsp;)+roof repair for your East Coast home, you(['’]|&#8217;)ll benefit/g, 'When you replace the roof on your East Coast home, you$1ll benefit'],
  // /roofing-costs/
  [/Quality Roof Replacements and Repairs/g, 'Quality Roof Replacements'],
  // /gutters/gutter-guards/
  [/local gutter repair company/g, 'local gutter company'],
  // /about/
  [/the repairs completed on these properties are only as good as/g, 'the work completed on these properties is only as good as'],
  // /about/, /podcast/
  [/From repairing a broken gutter to working on an insurance approved restoration/g, 'From new gutter systems to insurance-approved restorations'],
  // The roofing cards (/roofing/, /about/, /podcast/): the Attic Insulation card carried the
  // Roof Repairs card's text.
  [/In addition to new roof installations, our team has experience repairing issues with existing roofs\./g, 'Environmentally friendly insulation that keeps your home comfortable all year.'],
];

const ancestors = (n) => {
  const out = [];
  for (let a = n.parentNode; a; a = a.parentNode) out.push(a);
  return out;
};
const nextElement = (n) => {
  const sibs = n.parentNode?.childNodes || [];
  for (let i = sibs.indexOf(n) + 1; i < sibs.length; i++) {
    if (sibs[i].tagName) return sibs[i];
    if (sibs[i].nodeName === '#text' && sibs[i].value.trim()) return null;
  }
  return null;
};
const withClass = (n, add, remove = []) => n.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: [...classes(n).filter((c) => !remove.includes(c)), ...add].join(' ') } : a));

const fmt = (n) => n.toLocaleString('en-US');
const andList = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs.join(''));
const ICON_PHONE =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>';
const ICON_DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M11 4h2v12.2l4.6-4.6 1.4 1.4-7 7-7-7 1.4-1.4 4.6 4.6z"/></svg>';

// /service-areas/ hero: the text column says where Panda works (from the US map's data,
// so the two always agree), the map section gets an id for the chips and the map button
// to point at, and the photo is preloaded. The photo itself is set in site-fixes.css.
function serviceAreasHero(doc, html, ed, { pathname, siteDir }, changes) {
  const hero = find(doc, (c) => hasClass(c, 'service-area-hero'));
  const text = hero && find(hero, (c) => hasClass(c, 'text-section'));
  const h1 = text && find(text, (c) => c.tagName === 'h1');
  if (!h1 || hasClass(hero, 'pfix-sa-hero')) return false;
  if (siteDir && ![SA_HERO_PHOTO, `${SA_HERO_PHOTO}.webp`].every((f) => fs.existsSync(path.join(siteDir, f)))) {
    console.warn(`site-fixes: ${pathname}: the hero photo is missing from the site, hero left as is`);
    return false;
  }
  const { states, stateByCode, areas } = loadUsMap();
  const jobs = states.reduce((n, s) => n + (Number(s.jobs) || 0), 0);
  const offices = areas.length;
  const officeStates = [...new Set(areas.map((a) => a.state))].map((code) => stateByCode.get(code).name);
  const top = [...states].sort((a, b) => (Number(b.jobs) || 0) - (Number(a.jobs) || 0)).slice(0, SA_HERO_CHIPS);
  const more = states.length - top.length;

  const stat = (value, label) => `<div class="pfix-sa-hero__stat" role="listitem"><b>${value}</b><span>${esc(label)}</span></div>`;
  const chip = (s) =>
    `<a class="pfix-sa-hero__chip" href="#${SA_MAP_ID}" data-pfix-state="${esc(s.code)}">${esc(s.name)}${s.jobs ? ` <span>${fmt(Number(s.jobs))}</span>` : ''}</a>`;
  const column =
    `<p class="pfix-sa-hero__eyebrow">Our Service Areas</p>` +
    startTag(h1, withClass(h1, ['pfix-sa-hero__title'])) +
    esc(`Local exterior remodelers with ${offices} offices on the East Coast`) +
    `</h1>` +
    `<p class="pfix-sa-hero__sub">${esc(
      `${jobs ? `We’ve completed ${fmt(jobs)} jobs in ${states.length} states.` : `We work in ${states.length} states.`} ` +
        `Our local offices are in ${andList(officeStates)}.`
    )}</p>` +
    `<div class="pfix-sa-hero__stats" role="list">` +
    (jobs ? stat(fmt(jobs), 'Jobs completed') : '') +
    stat(states.length, 'States') +
    stat(offices, 'Local offices') +
    stat(`${GOOGLE_RATING}<span class="pfix-sa-hero__star" aria-hidden="true">★</span>`, 'Google rating') +
    `</div>` +
    `<div class="pfix-sa-hero__areas">` +
    `<p class="pfix-sa-hero__label" id="pfix-sa-hero-areas">${jobs ? 'Jobs completed by state' : 'Some of the states we work in'}</p>` +
    `<div class="pfix-sa-hero__chips" role="group" aria-labelledby="pfix-sa-hero-areas">` +
    top.map(chip).join('') +
    (more > 0 ? `<a class="pfix-sa-hero__chip pfix-sa-hero__chip--more" href="#${SA_MAP_ID}" data-pfix-state="" aria-label="See all ${states.length} states on the map">+${more} more</a>` : '') +
    `</div></div>` +
    `<div class="pfix-sa-hero__ctas">` +
    `<a class="pfix-sa-hero__btn pfix-sa-hero__btn--call" href="${PHONE.href}">${ICON_PHONE}` +
    `<span class="pfix-sa-hero__long">Call ${PHONE.text}</span><span class="pfix-sa-hero__short" aria-hidden="true">Call us</span></a>` +
    `<a class="pfix-sa-hero__btn pfix-sa-hero__btn--map" href="#${SA_MAP_ID}">${ICON_DOWN}See the map</a>` +
    `</div>`;
  ed.retag(hero, withClass(hero, ['pfix-sa-hero']));
  ed.inner(text, column);

  // The section the large map sits in (its heading is "Proud to Serve…").
  const section = find(doc, (c) => hasClass(c, 'Area_Section'));
  if (section && !attr(section, 'id')) ed.retag(section, [...section.attrs, { name: 'id', value: SA_MAP_ID }]);
  else if (!section) console.warn(`site-fixes: ${pathname}: no map section, the hero's map links go nowhere`);

  // Fetch the photo with the page instead of when WP Rocket's lazy loader gets to it.
  const headEnd = headEndOffset(html);
  if (headEnd >= 0) ed.replace(headEnd, headEnd, `<link rel="preload" as="image" type="image/webp" href="${SA_HERO_PHOTO}.webp" fetchpriority="high">`);

  changes.push(
    `service areas hero: says where Panda works (${fmt(jobs)} jobs, ${states.length} states, ${offices} offices), ` +
      `with state chips that zoom the map, call and map buttons and a sharp drone photo (was a stretched roof strip)`
  );
  return true;
}

// One photo card linking to a service page: { href, title, text, img: [src, w, h] }, with
// an optional group label above the title and call to action (default "Learn more").
function serviceCard(s, exists) {
  const [src, w, h] = s.img;
  const webp = exists(`${src}.webp`) ? `<source type="image/webp" srcset="${esc(src)}.webp">` : '';
  return (
    `<a class="pfix-svc" href="${esc(s.href)}">` +
    `<span class="pfix-svc__media"><picture>${webp}<img src="${esc(src)}" alt="" width="${w}" height="${h}" loading="lazy" decoding="async"></picture></span>` +
    `<span class="pfix-svc__body">${s.group ? `<span class="pfix-svc__group">${esc(s.group)}</span>` : ''}` +
    `<h3 class="pfix-svc__title">${esc(s.title)}</h3><span class="pfix-svc__text">${esc(s.text)}</span>` +
    `<span class="pfix-svc__more">${esc(s.cta || 'Learn more')}<span aria-hidden="true"> →</span></span></span></a>`
  );
}
const fileExists = (siteDir) => (src) => !siteDir || fs.existsSync(path.join(siteDir, src));

// A row of photo cards (one per service page, each linking to it) that moves with the logo
// row's script (.pfix-marquee in site-fixes.js), easing to a stop under the mouse; without
// JavaScript or with reduced motion the cards sit still, wrapped in rows. Cards whose photo
// is missing from the site are left out. Returns the HTML, or '' with too few photos.
function serviceCardsRow(list, { pathname, siteDir }) {
  const exists = fileExists(siteDir);
  const cards = list.filter((s) => exists(s.img[0]));
  if (cards.length < list.length) console.warn(`site-fixes: ${pathname}: ${list.length - cards.length} service photo(s) missing, those cards left out`);
  if (cards.length < 4) return { html: '', count: 0 };
  return {
    html:
      `<div class="pfix-marquee pfix-marquee--cards" data-speed="34" role="region" aria-label="Our services">` +
      `<div class="pfix-marquee__track" role="list">${cards.map((s) => `<div class="pfix-marquee__item" role="listitem">${serviceCard(s, exists)}</div>`).join('')}</div></div>` +
      `<p class="pfix-services__all"><a href="/services/">See all our services<span aria-hidden="true"> →</span></a></p>`,
    count: cards.length,
  };
}

// /service-areas/ "Our Reliable Exterior Remodeling Services": four flat green boxes of
// text (Roofing, Solar, Commercial, Gutters) -> a gliding row of photo cards for every
// service page (SERVICE_CARDS).
function servicesCarousel(doc, html, ed, { pathname, siteDir }, changes) {
  const section = find(doc, (c) => hasClass(c, 'roofers-section') && find(c, (x) => /^h[1-6]$/.test(x.tagName) && /Our Reliable Exterior Remodeling Services/.test(textOf(x))));
  // With the office pages (the site restructure): the section becomes the local offices.
  if (NEW_PAGES_ON) return serviceAreaOffices(doc, html, ed, section, changes);
  const grid = section && find(section, (c) => hasClass(c, 'Roof-grid'));
  // Already a carousel (a page built before): the cards may have changed, so the row is
  // rendered again from SERVICE_CARDS.
  const built = !grid && section && hasClass(section, 'pfix-services') ? find(section, (c) => hasClass(c, 'pfix-marquee--cards')) : null;
  if (!grid && !built) return false;
  const row = serviceCardsRow(SERVICE_CARDS, { pathname, siteDir });
  if (!row.count) return false;
  if (built) {
    const all = find(section, (c) => hasClass(c, 'pfix-services__all'));
    if (all) ed.outer(all, '');
    ed.outer(built, row.html);
    changes.push(`services carousel: ${row.count} photo cards (rendered again from SERVICE_CARDS)`);
    return true;
  }
  ed.retag(section, withClass(section, ['pfix-services']));
  ed.outer(grid, row.html);
  // The intro ran its two sentences together ("renovations.Some of…") on wide screens.
  const intro = find(section, (c) => c.tagName === 'p' && /manufacturers’ warranties/.test(textOf(c)));
  if (intro)
    ed.inner(
      intro,
      'We work with products backed by manufacturers’ warranties, so you get reliable results from every renovation. Here are the services we offer:'
    );
  changes.push(`services carousel: ${row.count} photo cards linking to each service page, gliding until hovered (was 4 green boxes of text)`);
  return true;
}

// /service-areas/ "Our Reliable Exterior Remodeling Services" (the services row that every
// other page has too) -> "Our local offices": a card per office with its state's map, its
// address and number, the jobs completed in its state and a link to its own page
// (new-pages.mjs). The site restructure; rendered again on every run.
function serviceAreaOffices(doc, html, ed, section, changes) {
  const own = find(doc, (c) => hasClass(c, 'pfix-sa-offices'));
  const target = own || section;
  if (!target) return false;
  const { states } = loadUsMap();
  const offices = [...contactPage().offices.items].sort((a, b) => (b.hq ? 1 : 0) - (a.hq ? 1 : 0));
  const card = (o) => {
    const jobs = states.find((x) => x.code === o.state)?.jobs || 0;
    return (
      `<a class="pfix-sa-office" role="listitem" href="${esc(officePagePath(o))}">` +
      `<span class="pfix-sa-office__map">${officeMap(o)}</span>` +
      `<span class="pfix-sa-office__body"><span class="pfix-sa-office__state">${esc(o.name)}${o.hq ? ' · Headquarters' : ''}</span>` +
      `<span class="pfix-sa-office__city">${esc(o.city)}, ${esc(o.state)}</span>` +
      `<span class="pfix-sa-office__addr">${esc(o.street)}, ${esc(o.locality)}</span>` +
      `<span class="pfix-sa-office__meta">${esc(o.phone)}${jobs >= 50 ? ` · ${fmt(jobs)} jobs in ${esc(o.state)}` : ''}</span>` +
      `<span class="pfix-sa-office__more">Visit the ${esc(o.city)} page<span aria-hidden="true"> →</span></span></span></a>`
    );
  };
  const out =
    `<section class="pfix-sa-offices" id="local-offices" aria-labelledby="pfix-sa-offices-title"><div class="pfix-sa-offices__inner">` +
    `<div class="pfix-sa-offices__head"><p class="pfix-sa-offices__eyebrow">Local offices</p>` +
    `<h2 class="pfix-sa-offices__title" id="pfix-sa-offices-title">Seven Local Offices, One Team</h2>` +
    `<p class="pfix-sa-offices__intro">Each office has local crews, its own number and a page with everything our team does in its state. Find the one nearest you.</p></div>` +
    `<div class="pfix-sa-offices__grid" role="list">${offices.map(card).join('')}</div>` +
    `<p class="pfix-sa-offices__all"><a href="/services/">See all our services<span aria-hidden="true"> →</span></a></p>` +
    `</div></section>`;
  const { startOffset, endOffset } = target.sourceCodeLocation;
  if (html.slice(startOffset, endOffset) === out) return true;
  if (ed.overlaps(startOffset, endOffset)) return false;
  ed.outer(target, out);
  changes.push('service areas: the services row -> the seven local offices, each linking to its page');
  return true;
}

// Roof repairs, off the site: the sections and cards about them, and every link to the
// removed /roofing/repairs/ page (a menu or site-map entry goes with its link; a link in
// running text keeps its words). The copy is handled with the typos (REPAIR_COPY).
function noRoofRepairs(doc, html, ed, changes) {
  const heading = (re) => (c) => /^h[1-6]$/.test(c.tagName) && re.test(clean(textOf(c)));
  const free = (n) => n.sourceCodeLocation && !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  let sections = 0;
  // /roofing/residential/: "Trustworthy East Coast Roof Repairs".
  for (const box of findAll(doc, (c) => hasClass(c, 'Service-container') && find(c, heading(/^Trustworthy East Coast Roof Repairs$/i)))) {
    if (!free(box)) continue;
    ed.outer(box, '');
    sections++;
  }
  // The roofing cards (/roofing/, /about/, /podcast/): the "Roof Repairs" card.
  for (const card of findAll(doc, (c) => hasClass(c, 'swiper-slide') && find(c, heading(/^Roof Repairs$/i)))) {
    if (!free(card)) continue;
    ed.outer(card, '');
    sections++;
  }
  // /roofing/residential/: "Roof Repairs" in the "Our services include:" list.
  for (const row of findAll(doc, (c) => hasClass(c, 'points-row') && clean(textOf(find(c, (x) => hasClass(x, 'Point-text')) || { childNodes: [] })) === 'Roof Repairs')) {
    if (!free(row)) continue;
    ed.outer(row, '');
    sections++;
  }
  // /reviews/: the one review that praises a roof repair (also out of reviews.json).
  for (const review of findAll(doc, (c) => hasClass(c, 'review') && /\brepairing my roof\b/i.test(textOf(find(c, (x) => hasClass(x, 'review-text')) || { childNodes: [] })))) {
    if (!free(review)) continue;
    ed.outer(review, '');
    sections++;
  }
  if (sections) changes.push(`roof repairs: ${sections} section(s), card(s), list entries or reviews about roof repairs removed`);
  let removed = 0;
  let unwrapped = 0;
  for (const a of findAll(doc, (c) => c.tagName === 'a' && REPAIRS_PAGE.test(attr(c, 'href') || ''))) {
    if (!free(a)) continue;
    const parent = a.parentNode;
    const sole = parent && (parent.tagName === 'li' || hasClass(parent, 'li')) && clean(textOf(parent)) === clean(textOf(a));
    const slot = hasClass(a, 'pfix-svc') && parent && (hasClass(parent, 'pfix-marquee__item') || hasClass(parent, 'pfix-svc-grid__item')) ? parent : null;
    if (hasClass(a, 'swiper-slide') || hasClass(a, 'service-link-card') || sole || slot) {
      ed.outer(slot || (sole ? parent : a), '');
      removed++;
    } else if (a.sourceCodeLocation.endTag) {
      const { startTag, endTag } = a.sourceCodeLocation;
      ed.replace(startTag.startOffset, startTag.endOffset, '');
      ed.replace(endTag.startOffset, endTag.endOffset, '');
      unwrapped++;
    }
  }
  if (removed || unwrapped) changes.push(`roof repairs: links to the removed page (${removed} removed with their menu or list entry, ${unwrapped} kept as plain words)`);
}

// /about/, /podcast/ ("Customer-Oriented Exterior Remodeling Services in the Mid-Atlantic")
// and /roofing/ ("Comprehensive Roofing and Exterior Remodeling Services"): a Swiper of six
// orange icon cards, three at a time with pale arrows, the third cut off at the edge. Only
// roofing was in it, twice ("Roofing Replacement" and "Replacement" both led to
// /roofing/replacement/), and half the descriptions belonged to other cards ("Attic
// Insulation": "…experience repairing issues with existing roofs"). It becomes the same
// gliding row of photo cards as on /service-areas/, in the section's orange: every service
// under "…just about any exterior remodel, including:", the roofing ones on /roofing/.
function teamServicesCarousel(doc, html, ed, { pathname, siteDir }, changes) {
  let done = false;
  for (const section of findAll(doc, (c) => hasClass(c, 'Team-section') && find(c, (x) => hasClass(x, 'roof-swiper')))) {
    const box = find(section, (c) => hasClass(c, 'Logo-container') && find(c, (x) => hasClass(x, 'roof-swiper')));
    if (!box) continue;
    const roofing = pathname.startsWith('/roofing/');
    const row = serviceCardsRow(roofing ? ROOFING_CARDS : SERVICE_CARDS, { pathname, siteDir });
    if (!row.count) continue;
    ed.retag(section, withClass(section, ['pfix-services', 'pfix-services--warm']));
    ed.outer(box, row.html);
    changes.push(
      `services carousel: ${row.count} ${roofing ? 'roofing ' : ''}photo cards linking to each service page, gliding until hovered ` +
        `(was a 3-up slider of icon cards repeating roof replacement, with mismatched descriptions)`
    );
    done = true;
  }
  // Already a row (a page built before): the cards may have changed, so it is rendered
  // again from SERVICE_CARDS / ROOFING_CARDS.
  for (const section of findAll(doc, (c) => hasClass(c, 'Team-section') && hasClass(c, 'pfix-services') && find(c, (x) => hasClass(x, 'pfix-marquee--cards')))) {
    const built = find(section, (c) => hasClass(c, 'pfix-marquee--cards'));
    if (ed.overlaps(built.sourceCodeLocation.startOffset, built.sourceCodeLocation.endOffset)) continue;
    const roofing = pathname.startsWith('/roofing/');
    const row = serviceCardsRow(roofing ? ROOFING_CARDS : SERVICE_CARDS, { pathname, siteDir });
    if (!row.count) continue;
    const all = find(section, (c) => hasClass(c, 'pfix-services__all'));
    if (all) ed.outer(all, '');
    ed.outer(built, row.html);
    changes.push(`services carousel: ${row.count} ${roofing ? 'roofing ' : ''}photo cards (rendered again from the card list)`);
    done = true;
  }
  return done;
}

// /services/, /solar/, /siding/, /gutters/, /commercial-roofing/: a grid of the same
// orange icon cards as the slider above (icon, orange title and rule, grey text, "Read
// More" button), standing still -> the same photo cards in a grid, with each page's own
// titles and text, in the section's orange. Broken links are mended (GRID_CARD_FIXES).
// The office cards on /contact-us/ (not links) are left alone.
function serviceGrids(doc, html, ed, { pathname, siteDir }, changes) {
  const exists = fileExists(siteDir);
  let done = false;
  // A grid an earlier build already made: its cards' links mended since then.
  for (const a of findAll(doc, (c) => c.tagName === 'a' && hasClass(c, 'pfix-svc') && c.parentNode && hasClass(c.parentNode, 'pfix-svc-grid__item'))) {
    // (not in a section another fix replaces: /solar/'s cards, solar-pages.mjs)
    if (ed.overlaps(a.sourceCodeLocation.startOffset, a.sourceCodeLocation.endOffset)) continue;
    const title = clean(textOf(find(a, (c) => hasClass(c, 'pfix-svc__title')) || { childNodes: [] }));
    const href = attr(a, 'href') || '';
    const textEl = find(a, (c) => hasClass(c, 'pfix-svc__text'));
    const text = clean(textOf(textEl || { childNodes: [] }));
    if (textEl && gridCardText(pathname, title, text) !== text) {
      ed.inner(textEl, esc(gridCardText(pathname, title, text)));
      changes.push(`services grid: card text: "${title}"`);
      done = true;
    }
    const fix = gridCardFix(pathname, title, href);
    if (!fix || fix.href === href) continue;
    ed.retag(a, a.attrs.map((x) => (x.name === 'href' ? { name: 'href', value: fix.href } : x)));
    const more = find(a, (c) => hasClass(c, 'pfix-svc__more'));
    if (more) ed.inner(more, `${esc(fix.cta)}<span aria-hidden="true"> →</span>`);
    changes.push(`services grid: link mended: "${title}" ${href} -> ${fix.href}`);
    done = true;
  }
  for (const grid of findAll(doc, (c) => hasClass(c, 'Service-cards'))) {
    const kids = (grid.childNodes || []).filter((c) => c.tagName);
    if (!kids.length || !kids.every((c) => c.tagName === 'a' && hasClass(c, 'service-link-card'))) continue;
    if (ed.overlaps(grid.sourceCodeLocation.startOffset, grid.sourceCodeLocation.endOffset)) continue;
    const fixed = [];
    const cards = kids.map((a) => {
      const title = clean(textOf(find(a, (c) => hasClass(c, 'team-heading')) || { childNodes: [] }));
      const text = clean(textOf(find(a, (c) => hasClass(c, 'team-para')) || { childNodes: [] }));
      // (by its corrected address, where it has one: RENAMED_PATHS in config.mjs)
      const href = renamedPath(attr(a, 'href') || '');
      const fix = gridCardFix(pathname, title, href);
      if (fix) fixed.push(`"${title}" ${href} -> ${fix.href}`);
      return { title, text: gridCardText(pathname, title, text), href: fix ? fix.href : href, cta: fix?.cta, img: fix ? fix.img : GRID_PHOTOS[href] };
    });
    const missing = cards.filter((s) => !s.title || !s.img || !exists(s.img[0]));
    if (missing.length) {
      console.warn(`site-fixes: ${pathname}: no photo for ${missing.map((s) => s.title || s.href).join(', ')}, service cards left as is`);
      continue;
    }
    const section = ancestors(grid).find((a) => hasClass(a, 'Team-section'));
    if (section && !hasClass(section, 'pfix-services')) ed.retag(section, withClass(section, ['pfix-services', 'pfix-services--warm']));
    ed.outer(
      grid,
      `<div class="pfix-svc-grid${cards.length < 3 ? ' pfix-svc-grid--pair' : ''}" role="list">` +
        cards.map((s) => `<div class="pfix-svc-grid__item" role="listitem">${serviceCard(s, exists)}</div>`).join('') +
        `</div>`
    );
    // /services/: an empty heading above "Our Services" and an empty one below it, and
    // "Our Services" itself without the site's heading style (small, in the corner).
    for (const h of findAll(section || grid.parentNode, (c) => /^h[1-6]$/.test(c.tagName) && !find(c, (x) => x.tagName === 'img'))) {
      if (!clean(textOf(h))) ed.outer(h, '');
      else if (h.tagName === 'h2' && !classes(h).some((c) => c !== 'mb-0') && !ancestors(h).includes(grid)) ed.retag(h, withClass(h, ['heading-2', 'text-center', 'pb-3']));
    }
    changes.push(
      `services grid: ${cards.length} photo cards (were icon cards)` + (fixed.length ? `; links mended: ${fixed.join(', ')}` : '')
    );
    done = true;
  }
  return done;
}

/** Collects the fixes for one page into the editor. Returns which fix assets the page needs. */
export function collectSiteFixes(doc, html, ed, { pageUrl, siteDir, siteOrigin }, changes) {
  const pathname = pageUrl ? new URL(pageUrl).pathname : '';
  const used = { css: false, js: false, reviews: false, reviewWall: false, gallery: false, pastProjects: false, blog: false, projects: false };
  // (Scripts inside a block another fix replaces, such as a blog post's hero, go with it.)
  const inlineScripts = (re) =>
    findAll(doc, (c) => c.tagName === 'script' && !attr(c, 'src') && re.test(rawText(c))).filter(
      (c) => !ed.overlaps(c.sourceCodeLocation.startOffset, c.sourceCodeLocation.endOffset)
    );
  const siteHost = siteOrigin ? new URL(siteOrigin).hostname.replace(/^www\./, '') : '';
  const localHref = (href) => {
    try {
      const u = new URL(href);
      return u.hostname.replace(/^www\./, '') === siteHost ? u.pathname + u.search + u.hash : href;
    } catch {
      return href;
    }
  };

  // The blog (/blog/, /blog/page/N/ and every post): the listing pages and the posts in the
  // blog's new design (blog.mjs, custom/blog/). First, so the fixes below leave the post hero,
  // its hidden copy, the share buttons and "Related Posts" it replaces be.
  if (collectBlogPages(doc, html, ed, { pathname, siteDir, siteOrigin }, changes)) used.blog = true;

  // The site restructure: menu entries of merged pages out, the new pages in (merged-pages.mjs).
  collectMergedNav(doc, html, ed, changes);

  // A page with no main heading (/roofing/attic-insulation/: its hero's headline was a div):
  // the hero's headline becomes the page's h1, looking the same (.pfix-h1).
  if (!find(doc, (c) => c.tagName === 'h1')) {
    const headline = find(doc, (c) => c.tagName === 'div' && hasClass(c, 'heading') && hasClass(c.parentNode, 'text-section') && ancestors(c).some((a) => hasClass(a, 'hero-section')));
    const st = headline?.sourceCodeLocation;
    if (st && !ed.overlaps(st.startOffset, st.endOffset)) {
      ed.retag(headline, withClass(headline, ['pfix-h1']), 'h1');
      changes.push('page heading: the hero headline is now the page’s h1 (it had none)');
      used.css = true;
    }
  }
  // /services/: titled "Roofing Services", though it is the page of every service.
  if (pathname === '/services/') {
    const title = 'Our Services | Panda Exteriors';
    for (const t of findAll(doc, (c) => c.tagName === 'title')) if (textOf(t) !== title) ed.inner(t, esc(title));
    for (const m of findAll(doc, (c) => c.tagName === 'meta' && ['og:title', 'twitter:title'].includes(attr(c, 'property') || attr(c, 'name')))) {
      if (attr(m, 'content') !== title) ed.retag(m, m.attrs.map((a) => (a.name === 'content' ? { name: 'content', value: title } : a)));
    }
  }

  // Top bar: weather readout -> free-estimate phone number; no more location prompt.
  const ribbon = find(doc, (c) => hasClass(c, 'xai-weather-ribbon'));
  const readout = ribbon && find(ribbon, (c) => hasClass(c, 'weather-data'));
  if (readout) {
    ed.inner(readout, `Free Estimates · Call <a class="pfix-ribbon-link" href="${PHONE.href}">${PHONE.text}</a>`);
    for (const s of inlineScripts(/api\.openweathermap\.org/)) ed.outer(s, '');
    changes.push('top bar: "Local Weather: N/A" -> free-estimate phone number (no location prompt)');
    used.css = true;
  }

  // Lead forms: the review count needs the WordPress API. The second form on a page (the
  // one in "About Our Team") uses total-reviews-1 or -2; the snapshot caught it showing
  // "Unable to load review count" or "Based on 0 reviews!".
  const counts = findAll(doc, (c) => /^total-reviews(-\d+)?$/.test(attr(c, 'id') || '')).filter(
    (c) => !ed.overlaps(c.sourceCodeLocation.startOffset, c.sourceCodeLocation.endOffset)
  );
  if (counts.length) {
    for (const el of counts) ed.inner(el, '<a class="pfix-reviews-link" href="/reviews/">Read our customer reviews</a>');
    for (const s of inlineScripts(/fetchReviewCount/)) ed.outer(s, '');
    changes.push(`lead form: "Unable to load review count" -> link to /reviews/ (${counts.length})`);
    used.css = true;
  }

  // /charity-and-community/: the page's sections become the redesigned page (charity-page.mjs);
  // its photo wall opens in the project gallery's viewer. First, so the fixes below leave
  // the sections it replaces be.
  if (collectCharityPage(doc, html, ed, { pathname, siteDir }, changes)) {
    used.css = true;
    used.gallery = true;
  }
  // /contact-us/: a hero with an office map and seven office cards with drawn maps, addresses
  // and call buttons, in place of the broken map pictures (contact-page.mjs). First too.
  if (collectContactPage(doc, html, ed, { pathname }, changes)) used.css = true;
  // /customer-service/: a hero with call, email and local offices and six help topics in
  // place of the title strip (customer-service-page.mjs). First too.
  if (collectCustomerServicePage(doc, html, ed, { pathname }, changes)) used.css = true;
  // 404.html: the header alone; a hero with "Oops! That page doesn't exist.", a link home and
  // a call button, and links to the main pages (not-found-page.mjs).
  if (collectNotFoundPage(doc, html, ed, changes)) used.css = true;
  // /terms-and-conditions/, /privacy-policy/: full-width text with white-on-white lists; a hero
  // and numbered sections beside a menu (legal-page.mjs, custom/site-fixes/legal-pages.json).
  if (collectLegalPage(doc, html, ed, { pathname }, changes)) used.css = true;
  // /blog/project/…/: a hero, the story beside "At a glance", a photo grid that opens the
  // project gallery's viewer and more projects, in place of a title strip over full-size
  // photos (project-pages.mjs, custom/projects/). First too.
  if (collectProjectPage(doc, html, ed, { pathname, siteDir }, changes)) {
    used.projects = true;
    used.gallery = true;
  }
  // Service pages: a "Recent projects" row above the testimonials, so every project page is
  // linked where it belongs (project-pages.mjs).
  if (collectProjectStrip(doc, html, ed, { pathname, siteDir }, changes)) used.projects = true;
  // /roofing-costs/: what affects the cost, the quality cards as icon cards, insurance roofing,
  // questions and the offers band (roofing-costs-page.mjs). First too, so the fixes below
  // leave the lime band it replaces be.
  if (collectRoofingCostsPage(doc, html, ed, { pathname, siteDir }, changes)) {
    used.css = true;
    used.js = true;
  }
  // /roofing/types/: four roof types (was three white cards on lime), side by side, how to
  // choose, why Panda, questions, the offers band and "About Our Team" on charcoal green
  // (roofing-types-page.mjs). First too, so the fixes below leave the lime band it replaces be.
  if (collectRoofingTypesPage(doc, html, ed, { pathname, siteDir, siteOrigin }, changes)) {
    used.css = true;
    used.js = true;
  }
  // /roofing/, /commercial-roofing/: "Our Process" as a numbered timeline; /roofing/: "About
  // Our Team" on charcoal green (roofing-page.mjs). First too, so the typo fixes below leave the process section be.
  if (collectRoofingPage(doc, html, ed, { pathname }, changes)) used.css = true;
  // /offers/: a new hero and new sections in place of the five flyer bands (offers-page.mjs).
  // Before the fixes below that edit inside those bands (column fit), which then leave them be.
  if (collectOffersPage(doc, html, ed, { pathname, siteDir }, changes)) {
    used.css = true;
    used.js = true;
  }
  // The "Limited Time Offers" band on seven pages: flyer pictures -> the offers as the
  // /offers/ page's coupon cards (offers-page.mjs); removed on /commercial-roofing/, where
  // both offers are for homes.
  if (collectOffersStrip(doc, html, ed, { pathname, siteDir }, changes)) {
    used.css = true;
    used.js = true;
  }
  // /blog/offer/…/: a sharp hero photo and a readable line under the heading (offers-page.mjs).
  if (collectOfferDetailPage(doc, html, ed, { pathname, siteDir }, changes)) used.css = true;

  // Header phone button: the offer pages' header said (877) 213-1240, with a link phones can't
  // dial (tel:+(877) 213-1240), where every other page's says the site's number.
  for (const a of findAll(doc, (c) => c.tagName === 'a' && /^tel:/.test(attr(c, 'href') || '') && ancestors(c).some((x) => hasClass(x, 'button-green')) && ancestors(c).some((x) => hasClass(x, 'nav')))) {
    if ((attr(a, 'href') || '').replace(/\D/g, '').replace(/^1/, '') === PHONE.href.replace(/\D/g, '').replace(/^1/, '')) continue;
    ed.retag(a, a.attrs.map((x) => (x.name === 'href' ? { name: 'href', value: PHONE.href } : x)));
    for (const t of textNodes(a)) editText(ed, html, t, (s) => s.replace(/\(\d{3}\) \d{3}-\d{4}/, PHONE.text));
    changes.push(`header phone button: ${clean(textOf(a))} -> ${PHONE.text}`);
  }

  // /reviews/: the one review under an old picture of the Google rating -> the review wall
  // (review-wall.mjs, custom/reviews/google-reviews.json). Before the fixes below that edit
  // inside that section (the "Read More Reviews!" button, the review about a roof repair).
  if (collectReviewWall(doc, ed, { pathname }, changes)) used.reviewWall = true;
  // /reviews/ hero: the Google rating, faces, a quote and buttons over a sharp photo; the
  // forms' rating picture shows the current rating (review-wall.mjs).
  if (collectReviewsHero(doc, html, ed, { pathname }, changes)) used.reviewWall = true;

  // Testimonials: every review carousel -> the looping review carousel (reviews.mjs).
  // Before the missing-photo fix below, which then leaves the replaced reviews alone.
  if (collectReviewCarousels(doc, ed, { pathname }, changes)) used.reviews = true;

  // "Our Project Gallery": the slider started three times over -> one tidy gallery
  // (project-gallery.mjs, custom/project-gallery/).
  if (collectProjectGalleries(doc, ed, changes, { selected: servicePage(pathname)?.gallery })) used.gallery = true;

  // /past-projects/: the grid of every project -> six favorites above the map
  // (past-projects.mjs; a full build puts them there while it adds the map, customize.mjs).
  if (renderPastProjects(doc, html, ed, { pathname, siteDir }, changes)) {
    used.pastProjects = true;
    used.projects = true;
    if (pathname === '/past-projects/') used.gallery = true;
  }

  // "Experts You Can Trust": the logo carousel (started by the site's own script for
  // every .swiper, stepping every 2.5 s) -> a gliding row. Its class names change so that
  // script leaves it alone; Swiper's leftovers in a rendered page (copies, sizes) go.
  const swiperState = (c) => /^swiper-/.test(c) && c !== 'swiper-wrapper' && c !== 'swiper-slide';
  const noSwiperAttrs = (n) =>
    n.attrs.filter((a) => !['style', 'role', 'aria-label', 'aria-live', 'data-swiper-slide-index'].includes(a.name) && !(a.name === 'id' && /^swiper-wrapper-/.test(a.value)));
  for (const box of findAll(doc, (c) => hasClass(c, 'swiper') && hasClass(c, 'swipper-Logo'))) {
    const wrapper = find(box, (c) => hasClass(c, 'swiper-wrapper'));
    const slides = wrapper ? (wrapper.childNodes || []).filter((c) => c.tagName && hasClass(c, 'swiper-slide')) : [];
    const logos = slides.filter((s) => hasClass(s, 'client-logo') && !hasClass(s, 'swiper-slide-duplicate'));
    if (!logos.length || logos.length !== slides.filter((s) => !hasClass(s, 'swiper-slide-duplicate')).length) continue;
    ed.retag(box, withClass({ attrs: noSwiperAttrs(box) }, ['pfix-marquee'], ['swiper', ...classes(box).filter(swiperState)]));
    ed.retag(wrapper, withClass({ attrs: noSwiperAttrs(wrapper) }, ['pfix-marquee__track'], ['swiper-wrapper']));
    for (const s of slides) {
      if (hasClass(s, 'swiper-slide-duplicate')) ed.outer(s, '');
      else ed.retag(s, withClass({ attrs: noSwiperAttrs(s) }, ['pfix-marquee__item'], ['swiper-slide', ...classes(s).filter(swiperState)]));
    }
    changes.push(`logo carousel: ${logos.length} logos glide past continuously (it jumped a step every 2.5 s)`);
    used.css = true;
    used.js = true;
  }

  // "About Our Team" / "Request an Appointment": the award badges picture -> the badges
  // one by one, with the other GAF certifications added (see BADGES).
  const haveBadges = !siteDir || BADGES.every((b) => fs.existsSync(path.join(siteDir, b.src)) && fs.existsSync(path.join(siteDir, `${b.src}.webp`)));
  for (const img of findAll(doc, (c) => c.tagName === 'img' && AWARDS_PICTURE.test(attr(c, 'data-lazy-src') || attr(c, 'src') || ''))) {
    if (!ancestors(img).some((a) => hasClass(a, 'Request-Container'))) continue;
    if (!haveBadges) {
      console.warn(`site-fixes: ${pathname}: a badge picture is missing from the site, award badges left as is`);
      break;
    }
    const pic = img.parentNode?.tagName === 'picture' ? img.parentNode : img;
    if (ed.overlaps(pic.sourceCodeLocation.startOffset, pic.sourceCodeLocation.endOffset)) continue;
    const badge = (b) =>
      `<div class="pfix-badges__item pfix-badges__item--${b.kind}" role="listitem"><picture>` +
      `<source type="image/webp" srcset="${esc(b.src)}.webp">` +
      `<img src="${esc(b.src)}" alt="${esc(b.alt)}" width="${b.width}" height="${b.height}" loading="lazy" decoding="async">` +
      `</picture></div>`;
    ed.outer(pic, `<div class="pfix-badges" role="list" aria-label="Certifications and awards">${BADGES.map(badge).join('')}</div>`);
    changes.push('award badges: the other GAF certifications (Diamond Pledge, Metal Certified) added beside President’s Club and the Inc. 5000 badges');
    used.css = true;
  }

  // Home hero: the award badges picture between two white lines (.logo-container, 260 px
  // wide) kept its fixed 562 px width above phone size -> lines and picture share one
  // width, no wider than the column (.pfix-hero-awards).
  const retagOnce = (n, cls) => {
    const st = n.sourceCodeLocation.startTag;
    if (hasClass(n, cls) || ed.overlaps(st.startOffset, st.endOffset)) return false;
    ed.retag(n, withClass(n, [cls]));
    return true;
  };
  for (const box of findAll(doc, (c) => hasClass(c, 'logo-container') && (c.childNodes || []).some((k) => k.tagName && hasClass(k, 'Flex-image')))) {
    if (!retagOnce(box, 'pfix-hero-awards')) continue;
    changes.push('hero awards picture: kept between its two lines, no wider than its column (it ran off the screen on tablets and under the form on small laptops)');
    used.css = true;
  }

  // Blocks with a fixed desktop width wider than their column at 1120–1199 px (1143 px
  // rows, the 1198 px blog article and its picture) -> no wider than the column (.pfix-fit);
  // long words (an email address) wrap inside the article. The award badges picture on
  // /roofing/residential/ is set 100 px in from the left, which ran it off the screen at
  // 480–529 px -> in line with the text above it below 768 px, as below 480 px already.
  const fixedWidth = findAll(doc, (c) => ['container-custom', 'Blog-detail', 'Blog-detail-img', 'img-flex-logos'].some((k) => hasClass(c, k))).filter((c) => retagOnce(c, 'pfix-fit'));
  // Blog post heroes: the topic and date tags have a 10 px right margin, which ran a few px
  // off the smallest phones' screens when a tag filled its line (.pfix-fit too).
  for (const box of findAll(doc, (c) => hasClass(c, 'text-section') && (c.childNodes || []).some((k) => k.tagName && hasClass(k, 'tag-text')))) {
    if (retagOnce(box, 'pfix-fit')) fixedWidth.push(box);
  }
  if (fixedWidth.length) {
    changes.push(`column fit: ${fixedWidth.length} fixed-width block(s) kept inside their column (they ran off the screen at some widths)`);
    used.css = true;
  }

  // The header's row (logo, menu, phone button) in its 960 px column at 1120–1199 px: the
  // button wrapped under the logo -> the row uses the whole width there (.pfix-header-row).
  for (const box of findAll(doc, (c) => hasClass(c, 'container') && c.parentNode && hasClass(c.parentNode, 'nav') && (c.childNodes || []).some((k) => k.tagName && hasClass(k, 'row-flex')))) {
    if (!retagOnce(box, 'pfix-header-row')) continue;
    changes.push('header: logo, menu and phone button kept in one row at 1120–1199 px (the button wrapped under the logo)');
    used.css = true;
  }

  // Header "Services" menu: its last entry, "Other", held Siding and Gutters (with Gutter
  // Guards one level further in) -> Gutters, Gutter Guards and Siding as their own entries
  // under Solar, built like the menu's other plain entries (no arrow, no further level).
  for (const menu of findAll(doc, (c) => hasClass(c, 'Service-Menu'))) {
    const list = (menu.childNodes || []).find((k) => k.tagName && hasClass(k, 'sub_menu'));
    const other = list && (list.childNodes || []).find((k) => k.tagName && hasClass(k, 'has_dropdown') && (k.childNodes || []).some((a) => a.tagName === 'a' && clean(textOf(a)) === 'Other'));
    if (!other || ed.overlaps(other.sourceCodeLocation.startOffset, other.sourceCodeLocation.endOffset)) continue;
    const sample = find(list, (c) => c.tagName === 'a' && hasClass(c, 'Nav-Link-Hover') && hasClass(c.parentNode, 'li') && !hasClass(c.parentNode, 'mobile-show'));
    const liClass = sample ? attr(sample.parentNode, 'class') : 'oxy-container li';
    const aClass = sample ? attr(sample, 'class') : 'oxy-text-link Nav-Link Nav-Link-Hover';
    ed.outer(
      other,
      SERVICE_MENU_ITEMS.map(([label, href]) => `<div class="${esc(liClass)}"><a class="${esc(aClass)}" href="${esc(href)}" target="_self"> ${esc(label)} </a></div>`).join(' ')
    );
    changes.push('services menu: "Other" -> Gutters, Gutter Guards and Siding as their own entries');
  }

  // Header "Services" ▸ "Solar": a phone-only "Solar" link and "GAF Solar Roof", so nothing
  // said the Solar page is about panels or that the two are different products -> "Solar
  // Panels" (shown at every size) and "GAF Solar Shingles", each with a line saying what it
  // is (.pfix-nav-hint). Each entry is edited on its own: the merged "Solar Panel
  // Installation" entry is merged-pages.mjs's; one left pointing at /solar/ (/careers/) goes.
  for (const menu of findAll(doc, (c) => hasClass(c, 'Service-Menu'))) {
    const list = (menu.childNodes || []).find((k) => k.tagName && hasClass(k, 'sub_menu'));
    const ownA = (n) => (n.childNodes || []).find((a) => a.tagName === 'a');
    const solar = list && (list.childNodes || []).find((k) => k.tagName && hasClass(k, 'has_dropdown') && ownA(k) && SOLAR_LABELS.includes(clean(textOf(ownA(k)))));
    const sub = solar && (solar.childNodes || []).find((k) => k.tagName && hasClass(k, 'sub_menu'));
    if (!sub || find(sub, (c) => hasClass(c, 'pfix-nav-hint'))) continue;
    const sample = find(list, (c) => c.tagName === 'a' && hasClass(c, 'Nav-Link-Hover') && hasClass(c.parentNode, 'li') && !hasClass(c.parentNode, 'mobile-show'));
    const liClass = sample ? attr(sample.parentNode, 'class') : 'oxy-container li';
    const aClass = sample ? attr(sample, 'class') : 'oxy-text-link Nav-Link Nav-Link-Hover';
    const seen = new Set();
    let edited = 0;
    for (const li of (sub.childNodes || []).filter((k) => k.tagName && hasClass(k, 'li'))) {
      const a = ownA(li);
      let to = a && attr(a, 'href');
      try {
        to = to && new URL(to, SITE_ORIGIN).pathname;
      } catch {
        to = null;
      }
      const item = SOLAR_MENU_ITEMS.find(([, href]) => href === to);
      if (!item || ed.overlaps(li.sourceCodeLocation.startOffset, li.sourceCodeLocation.endOffset)) continue;
      const [label, href, hint] = item;
      ed.outer(li, seen.has(href) ? '' : `<div class="${esc(liClass)}"><a class="${esc(aClass)}" href="${esc(href)}" target="_self"> ${esc(label)} <span class="pfix-nav-hint">${esc(hint)}</span></a></div>`);
      seen.add(href);
      edited++;
    }
    if (!edited) continue;
    changes.push('services menu: Solar -> "Solar Panels" and "GAF Solar Shingles", each with a line saying what it is');
    used.css = true;
  }

  // Header "Services" ▸ "Solar" itself led to /solar/, the solar panels page -> "Solar
  // Options", leading to the Solar Options page, which shows both products (new-pages.mjs).
  // Behind the menu button (phones and tablets), the site's script made a tap on it open its
  // list instead; site-fixes.js makes the entry open the page and its arrow open the list.
  if (NEW_PAGES_ON) {
    for (const menu of findAll(doc, (c) => hasClass(c, 'Service-Menu'))) {
      const list = (menu.childNodes || []).find((k) => k.tagName && hasClass(k, 'sub_menu'));
      const ownA = (n) => (n.childNodes || []).find((a) => a.tagName === 'a');
      const solar = list && (list.childNodes || []).find((k) => k.tagName && hasClass(k, 'has_dropdown') && ownA(k) && SOLAR_LABELS.includes(clean(textOf(ownA(k)))));
      const sub = solar && (solar.childNodes || []).find((k) => k.tagName && hasClass(k, 'sub_menu'));
      if (!sub) continue;
      // Behind the menu button, tapping the entry opens its page and its arrow opens its list
      // (site-fixes.js); the arrow gets a bigger tap area (site-fixes.css).
      used.js = true;
      used.css = true;
      const sitePath = (a) => {
        try {
          return new URL(attr(a, 'href') || '', SITE_ORIGIN).pathname;
        } catch {
          return null;
        }
      };
      let done = false;
      const a = ownA(solar);
      const tag = a.sourceCodeLocation.startTag;
      if (sitePath(a) !== SOLAR_OPTIONS_PATH && !ed.overlaps(tag.startOffset, tag.endOffset)) {
        ed.retag(a, a.attrs.map((x) => (x.name === 'href' ? { name: 'href', value: SOLAR_OPTIONS_PATH } : x)));
        done = true;
      }
      const label = find(a, (c) => hasClass(c, 'oxy-text'));
      if (label && clean(textOf(label)) !== SOLAR_OPTIONS_LABEL && !ed.overlaps(label.sourceCodeLocation.startOffset, label.sourceCodeLocation.endOffset)) {
        ed.inner(label, `\n${SOLAR_OPTIONS_LABEL}\n`);
        done = true;
      }
      // The phone-only "Solar Options" entry an earlier build put at the top of the list: the
      // entry itself opens the page now, so it only repeated it.
      for (const li of (sub.childNodes || []).filter((k) => k.tagName && hasClass(k, 'mobile-show') && ownA(k) && sitePath(ownA(k)) === SOLAR_OPTIONS_PATH)) {
        if (ed.overlaps(li.sourceCodeLocation.startOffset, li.sourceCodeLocation.endOffset)) continue;
        ed.outer(li, '');
        done = true;
      }
      if (done) changes.push('services menu: "Solar" -> "Solar Options", leading to the Solar Options page (was the solar panels page)');
    }
  }

  // Inc. 5000 awards section: on /about/ and /podcast/ it sat on lime with white swooshes
  // (white text about 1.7:1, a swoosh running through the paragraph, the badges' white
  // circles showing on the lime); on /roofing/ it was plain black on white with a centred
  // heading over left-aligned text. Everywhere it is now one light band: the heading and
  // paragraph (unchanged) on the left with the two rankings the badges show, and the badges
  // on a white card on the right (.pfix-awards).
  for (const box of findAll(doc, (c) => hasClass(c, 'awards-section'))) {
    if (hasClass(box, 'pfix-awards')) continue;
    const heading = find(box, (c) => hasClass(c, 'awards-heading'));
    const para = find(box, (c) => hasClass(c, 'awards-para'));
    if (!heading || !para) continue;
    const st = box.sourceCodeLocation.startTag;
    if (ed.overlaps(st.startOffset, box.sourceCodeLocation.endOffset)) continue;
    const plain = (n) => clean(textOf(n)).replace(/[\u200b\u00a0]/g, ' ').replace(/\s+/g, ' ').trim();
    const webp = (src) => !siteDir || fs.existsSync(path.join(siteDir, `${src}.webp`));
    const picture =
      `<picture>${webp(INC_TRIO.src) && webp(INC_TRIO.large) ? `<source type="image/webp" srcset="${INC_TRIO.src}.webp 768w, ${INC_TRIO.large}.webp 800w" sizes="(max-width: 575px) 90vw, 480px">` : ''}` +
      `<img src="${INC_TRIO.src}" srcset="${INC_TRIO.src} 768w, ${INC_TRIO.large} 800w" sizes="(max-width: 575px) 90vw, 480px" width="${INC_TRIO.width}" height="${INC_TRIO.height}" loading="lazy" decoding="async" ` +
      `alt="Inc. 5000 2024 badges: No. 1 in construction, the Inc. 5000 seal, and No. 50 of America’s fastest-growing private companies"></picture>`;
    ed.retag(box, withClass(box, ['pfix-awards']));
    ed.inner(
      box,
      `<div class="container pfix-awards__inner"><div class="pfix-awards__text">` +
        `<p class="pfix-awards__eyebrow">National recognition</p>` +
        `<h2 class="pfix-awards__title">${esc(plain(heading))}</h2>` +
        `<p class="pfix-awards__para">${esc(plain(para))}</p>` +
        `<div class="pfix-awards__stats" role="list">${INC_STATS.map(([n, t]) => `<div class="pfix-awards__stat" role="listitem"><b>${esc(n)}</b><span>${esc(t)}</span></div>`).join('')}</div>` +
        `</div><figure class="pfix-awards__badges">${picture}</figure></div>`
    );
    // /about/ and /podcast/: the wrapper that painted the lime and the swooshes.
    const wrap = box.parentNode;
    if (wrap && hasClass(wrap, 'awards-bg')) retagOnce(wrap, 'pfix-awards-wrap');
    changes.push('awards section: one light band with the heading, the two rankings and the badges on a white card (was lime with swooshes, or plain)');
    used.css = true;
  }

  // "About Our Team" (and the same block on the offer pages): white text on Panda lime was
  // hard to read (about 1.7:1 with the paragraphs at 80% opacity) -> a charcoal green, with
  // the lime kept for its button (.pfix-about). The white version of the block is left as is.
  const about = findAll(doc, (c) => hasClass(c, 'Request-Container') && hasClass(c, 'primary-bg')).filter((c) => retagOnce(c, 'pfix-about'));
  if (about.length) {
    changes.push(`about section colors: charcoal green background, lime button (white on lime was hard to read) (${about.length})`);
    used.css = true;
  }

  // The white version of "About Our Team" (/roofing/, /roofing/types/, /reviews/, /faqs/): its
  // styled h2 was empty, with the words in a bare h2 inside it (in the page as captured; a
  // browser shows them as a second, unstyled h2 in the system font). The words go into the
  // styled h2, and the bare one (and the stray end tag) go.
  let aboutHeadings = 0;
  for (const col of findAll(doc, (c) => hasClass(c, 'Local-text-col') && ancestors(c).some((a) => hasClass(a, 'Request-Container')))) {
    const styled = col.childNodes.find((c) => c.tagName === 'h2' && hasClass(c, 'heading'));
    const bare = styled && col.childNodes.find((c) => c.tagName === 'h2' && !c.attrs.length && clean(textOf(c)));
    if (!bare || clean(textOf(styled))) continue;
    const from = styled.sourceCodeLocation.startOffset;
    let to = bare.sourceCodeLocation.endOffset;
    const stray = /^\s*<\/h2>/.exec(html.slice(to));
    if (stray) to += stray[0].length;
    if (ed.overlaps(from, to)) continue;
    const tag = html.slice(styled.sourceCodeLocation.startTag.startOffset, styled.sourceCodeLocation.startTag.endOffset);
    ed.replace(from, to, `${tag}${esc(clean(textOf(bare)))}</h2>`);
    aboutHeadings++;
  }
  if (aboutHeadings) changes.push(`about heading: "About Our Team" in the block's styled heading (was in a second, unstyled h2) (${aboutHeadings})`);

  // "Request an Appointment" (the "About Our Team" block's version on /offers/): its paragraph
  // was printed twice, one copy under the other -> once.
  let repeats = 0;
  for (const col of findAll(doc, (c) => hasClass(c, 'Local-text-col') && ancestors(c).some((a) => hasClass(a, 'Request-Container')))) {
    const paras = (col.childNodes || []).filter((k) => k.tagName === 'p' && hasClass(k, 'local-text'));
    for (let i = 1; i < paras.length; i++) {
      const p = paras[i];
      if (clean(textOf(p)) !== clean(textOf(paras[i - 1])) || ed.overlaps(p.sourceCodeLocation.startOffset, p.sourceCodeLocation.endOffset)) continue;
      ed.outer(p, '');
      repeats++;
    }
  }
  if (repeats) changes.push(`repeated paragraph: "Request an Appointment" said "To request an appointment…" twice (${repeats})`);

  // Removed on request.
  if (pathname === '/reviews/') {
    for (const b of findAll(doc, (c) => hasClass(c, 'bde-button') && /^Read More Reviews!?$/i.test(clean(textOf(c))))) {
      if (ed.overlaps(b.sourceCodeLocation.startOffset, b.sourceCodeLocation.endOffset)) continue;
      ed.outer(b, '');
      changes.push('removed on request: the "Read More Reviews!" button');
    }
  }
  if (pathname === '/service-areas/') {
    // "Expert Roofers on the East Coast" (text and truck photo, under the hero) and the
    // green "Learn More About Our Exterior Remodeling Services" band (text and photo).
    const SECTIONS = [
      ['Service-container', 'Expert Roofers on the East Coast'],
      ['Client-section', 'Learn More About Our Exterior Remodeling Services'],
    ];
    for (const [cls, title] of SECTIONS) {
      const heading = (c) => /^h[1-6]$/.test(c.tagName) && clean(textOf(c)) === title;
      for (const box of findAll(doc, (c) => hasClass(c, cls) && find(c, heading))) {
        ed.outer(box, '');
        changes.push(`removed on request: the "${title}" section`);
      }
    }
    // The truck photo went with its section: no more fetching it first.
    for (const l of findAll(doc, (c) => c.tagName === 'link' && attr(c, 'rel') === 'preload' && /Panda-Exteriors-Truck/.test(attr(c, 'imagesrcset') || attr(c, 'href') || ''))) {
      ed.outer(l, '');
    }
  }

  // Pictures that are missing (on the live site too).
  const exists = (src) => {
    try {
      return fs.existsSync(path.join(siteDir, decodeURIComponent(src.split(/[?#]/)[0])));
    } catch {
      return true;
    }
  };
  const galleries = new Map(); // gallery grid -> tiles removed
  for (const img of findAll(doc, (c) => c.tagName === 'img')) {
    const src = [attr(img, 'data-lazy-src'), attr(img, 'src')].find((s) => s && s.startsWith('/') && !s.startsWith('//'));
    if (!siteDir || !src || exists(src)) continue;
    if (ed.overlaps(img.sourceCodeLocation.startOffset, img.sourceCodeLocation.endOffset)) continue; // inside something already removed
    const alt = attr(img, 'alt') || '';
    if (hasClass(img, 'profile-testi')) {
      // Initials of the name shown on the card (the photo's alt text as a fallback).
      const card = ancestors(img).find((a) => a.tagName && find(a, (c) => hasClass(c, 'profile-name')));
      const shown = card ? clean(textOf(find(card, (c) => hasClass(c, 'profile-name')))) : '';
      const initials = (shown || alt).replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '★';
      const target = img.parentNode?.tagName === 'picture' ? img.parentNode : img;
      const noscript = target === img ? nextElement(img) : null;
      const end = (noscript?.tagName === 'noscript' ? noscript : target).sourceCodeLocation.endOffset;
      ed.replace(target.sourceCodeLocation.startOffset, end, `<span class="${esc([...classes(img), 'pfix-avatar'].join(' '))}" aria-hidden="true">${esc(initials)}</span>`);
      changes.push(`missing reviewer photo -> initials "${initials}" (${shown || alt || src})`);
      used.css = true;
      continue;
    }
    // A gallery tile: the Interiors gallery's (pi-gallery-item), /gallery/'s filterable grid
    // (ee-gallery-item, laid out again by its script) and the thumbnails of the lightbox the
    // rendered page kept (lg-thumb-item; the script builds its own when the page loads).
    const tile = ancestors(img).find((a) => hasClass(a, 'pi-gallery-item') || hasClass(a, 'ee-gallery-item') || hasClass(a, 'lg-thumb-item'));
    if (tile) {
      ed.outer(tile, '');
      if (hasClass(tile, 'pi-gallery-item')) galleries.set(tile.parentNode, (galleries.get(tile.parentNode) || 0) + 1);
      if (!hasClass(tile, 'lg-thumb-item')) changes.push(`gallery tile with a missing photo removed (${alt || src})`);
    }
  }
  // The tiles left keep the size they had in a full row of four (.pfix-gallery).
  for (const [grid, removed] of galleries) {
    const left = (grid.childNodes || []).filter((c) => hasClass(c, 'pi-gallery-item')).length - removed;
    if (left < 1 || left > 3 || attr(grid, 'style')) continue;
    ed.retag(grid, [...withClass(grid, ['pfix-gallery']), { name: 'style', value: `--pfix-gallery-n: ${left}` }]);
    used.css = true;
  }

  // A link whose href ended up inside its style attribute (a missing quote on the live
  // site: style="color: #f26924; href="https://…/roofing/">). In a rendered page the
  // browser has already split the URL into empty attributes: https: pandaexteriors.com roofing.
  for (const a of findAll(doc, (c) => c.tagName === 'a' && !attr(c, 'href') && /href\s*=/.test(attr(c, 'style') || ''))) {
    const st = a.sourceCodeLocation.startTag;
    let url = html.slice(st.startOffset, st.endOffset).match(/href\s*=\s*"?\s*(https?:\/\/[^"\s>]+)/i)?.[1];
    if (!url) {
      const names = a.attrs.map((x) => x.name);
      const i = names.findIndex((n) => /^https?:$/i.test(n));
      const parts = i < 0 ? [] : names.slice(i + 1).filter((n) => /^[\w.~%-]+$/.test(n));
      if (parts.length) url = `${names[i]}//${parts.join('/')}/`; // the site's page URLs end in /
    }
    if (!url) continue;
    const href = localHref(url);
    const style = (attr(a, 'style') || '').split(/href\s*=/i)[0].trim();
    ed.replace(st.startOffset, st.endOffset, `<a href="${esc(href)}"${style ? ` style="${esc(style)}"` : ''}>`);
    changes.push(`broken link repaired ("${clean(textOf(a))}" -> ${href})`);
  }

  // Placeholder phone links.
  for (const a of findAll(doc, (c) => c.tagName === 'a' && /^tel:\+?1?234567890$/.test(attr(c, 'href') || ''))) {
    ed.retag(a, a.attrs.map((x) => (x.name === 'href' ? { name: 'href', value: PHONE.href } : x)));
    for (const t of textNodes(a)) editText(ed, html, t, (s) => s.replace(/\(XXX\) XXX-XXXX/g, PHONE.text));
    changes.push(`placeholder phone link -> ${PHONE.text} ("${clean(textOf(a)).replace(/\(XXX\) XXX-XXXX/, PHONE.text)}")`);
  }

  // Blog share buttons -> plain share links.
  const shares = findAll(doc, (c) => c.tagName === 'div' && (hasClass(c, 'js-breakdance-share-button') || hasClass(c, 'js-breakdance-share-mobile')));
  if (shares.length) {
    const canonical = attr(find(doc, (c) => c.tagName === 'link' && attr(c, 'rel') === 'canonical') || {}, 'href') || siteOrigin + pathname;
    const title = attr(find(doc, (c) => c.tagName === 'meta' && attr(c, 'property') === 'og:title') || {}, 'content') || clean(textOf(find(doc, (c) => c.tagName === 'title') || { childNodes: [] }));
    const u = encodeURIComponent(canonical);
    const t = encodeURIComponent(title);
    const urls = {
      Facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      Twitter: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      Email: `mailto:?subject=${t}&body=${u}`,
    };
    let n = 0;
    for (const b of shares) {
      // (A blog post's share buttons are replaced by its new share links, blog.mjs.)
      if (ed.overlaps(b.sourceCodeLocation.startOffset, b.sourceCodeLocation.endOffset)) continue;
      const network = attr(b, 'data-network') || '';
      const native = hasClass(b, 'js-breakdance-share-mobile') || !network;
      const href = native ? urls.Email : urls[network];
      if (!href) continue;
      const attrs = native ? [...withClass(b, ['pfix-share-native']), { name: 'data-share-url', value: canonical }, { name: 'data-share-title', value: title }] : [...b.attrs];
      attrs.push({ name: 'href', value: href });
      if (href.startsWith('http')) attrs.push({ name: 'target', value: '_blank' }, { name: 'rel', value: 'noopener' });
      ed.retag(b, attrs, 'a');
      n++;
    }
    // Their start-up script needs a library that is missing (on the live site too).
    for (const s of inlineScripts(/new BreakdanceSocialShareButtons\(/)) ed.outer(s, '');
    if (n) changes.push(`share buttons: ${n} made into working share links`);
    used.css = true;
    used.js = true;
  }

  // /services/, /gutters/, /siding/, /roofing-costs/, /roofing/, the solar pages: the hero gets service chips and estimate and call buttons
  // (services-hero.mjs).
  if (collectServiceHero(doc, html, ed, { pathname, siteDir }, changes)) used.css = true;
  // /gutters/, /siding/, /roofing/, /solar/: "Why work with us" as icon cards, and a spot for the hero's chip (gutters-page.mjs).
  if (collectGuttersPage(doc, html, ed, { pathname }, changes)) used.css = true;
  // /gutters/gutter-guards/: the benefits as icon cards, how it works, questions, a band for
  // new gutters and the offers band (gutter-guards-page.mjs).
  if (collectGutterGuardsPage(doc, html, ed, { pathname, siteDir }, changes)) {
    used.css = true;
    used.js = true;
  }
  // /solar/: its cards' heading names both products; /solar/gaf-solar-roof/: the benefits as
  // icon cards, shingles and panels side by side, how it works, questions, a band and the
  // offers band (solar-pages.mjs).
  if (collectSolarPages(doc, html, ed, { pathname, siteDir, siteOrigin }, changes)) {
    used.css = true;
    used.js = true;
  }
  // /about/: the hero introduces the company and "Our Mission" is a headline, three points
  // and a photo collage (about-page.mjs).
  if (collectAboutPage(doc, html, ed, { pathname }, changes)) used.css = true;
  // /faqs/: the hero gets a question search and topic chips, and the questions become
  // accordions grouped by topic beside a topic menu (faq-page.mjs).
  if (collectFaqPage(doc, html, ed, { pathname, siteOrigin }, changes)) {
    used.css = true;
    used.js = true;
  }

  // /service-areas/: the hero says where Panda works and links to the map.
  if (pathname === '/service-areas/' && serviceAreasHero(doc, html, ed, { pathname, siteDir }, changes)) {
    used.css = true;
    used.js = true;
  }
  if (pathname === '/service-areas/' && servicesCarousel(doc, html, ed, { pathname, siteDir }, changes)) {
    used.css = true;
    used.js = true;
  }
  if (teamServicesCarousel(doc, html, ed, { pathname, siteDir }, changes)) {
    used.css = true;
    used.js = true;
  }
  if (serviceGrids(doc, html, ed, { pathname, siteDir }, changes)) used.css = true;
  // /siding/, /gutters/, /roofing/: what the job involves, signs it's time, how it works,
  // questions.
  if (collectServicePage(doc, html, ed, { pathname, siteDir, siteOrigin }, changes)) used.css = true;
  // Lead forms: a form for the page's service (or the general one) in each form card, and
  // the old form's scripts removed (service-forms.mjs).
  if (collectServiceForms(doc, html, ed, { pathname }, changes)) {
    used.css = true;
    used.js = true;
  }
  // /gallery/: a hero with the page's heading, the categories and a photo collage
  // (gallery-page.mjs).
  // (Its category names come from the tabs, so they get the typo fixes too.)
  const fixTypos = (t) => TYPOS.reduce((x, [re, to]) => x.replace(re, to), t);
  if (collectGalleryPage(doc, html, ed, { pathname, siteDir, fixText: fixTypos }, changes)) {
    used.css = true;
    used.js = true;
  }
  // /referrals/: the referral sign-up was Panda's live GetTheReferral page laid over the
  // whole page, so a referral sent from this copy reached Panda. The page now explains the
  // program and links to the Panda Exteriors app, which is where referrals are sent
  // (referrals-page.mjs).
  if (collectReferralsPage(doc, html, ed, { pathname }, changes)) used.css = true;

  // A share title copied from the About page ("Panda Exteriors | About Us") on another
  // page: the page's own title (what the browser tab and search results show).
  if (pathname && pathname !== '/about/') {
    const title = clean(textOf(find(doc, (c) => c.tagName === 'title') || { childNodes: [] }));
    const shared = findAll(doc, (c) => c.tagName === 'meta' && ['og:title', 'twitter:title'].includes(attr(c, 'property') || attr(c, 'name')) && /\|\s*About Us$/.test(attr(c, 'content') || ''));
    if (title && shared.length) {
      const was = attr(shared[0], 'content');
      for (const m of shared) ed.retag(m, m.attrs.map((a) => (a.name === 'content' ? { name: 'content', value: title } : a)));
      changes.push(`share title: "${was}" -> "${title}"`);
    }
  }

  // Roof repairs: sections, cards and links (the wording is edited with the typos below).
  noRoofRepairs(doc, html, ed, changes);

  // Typos in visible text (not in URLs or attributes), and wording that offered roof
  // repairs (REPAIR_COPY). Skips text already being edited.
  const body = find(doc, (c) => c.tagName === 'body');
  const skip = new Set(['script', 'style', 'noscript', 'textarea', 'template']);
  const fixedTypos = new Set();
  let repairCopy = 0;
  const repairWording = (s) => REPAIR_COPY.reduce((x, [re, to]) => x.replace(re, (...m) => (repairCopy++, to.replace(/\$1/g, m[1] ?? ''))), s);
  const walkText = (n) => {
    if (n.tagName && skip.has(n.tagName)) return;
    if (n.nodeName === '#text') {
      const l = n.sourceCodeLocation;
      if (!l || ed.overlaps(l.startOffset, l.endOffset)) return;
      editText(ed, html, n, (s) =>
        repairWording(TYPOS.reduce((x, [re, to]) => x.replace(re, (m) => (fixedTypos.add(`${m} -> ${to}`), to)), s))
      );
      return;
    }
    for (const c of n.childNodes || []) walkText(c);
  };
  if (body) walkText(body);
  // The company description in the page's structured data (read by search engines).
  for (const s of findAll(doc, (c) => c.tagName === 'script' && attr(c, 'type') === 'application/ld+json')) {
    for (const t of s.childNodes || []) if (t.nodeName === '#text' && t.sourceCodeLocation && !ed.overlaps(t.sourceCodeLocation.startOffset, t.sourceCodeLocation.endOffset)) editText(ed, html, t, repairWording);
  }
  if (fixedTypos.size) changes.push(`typos: ${[...fixedTypos].join('; ')}`);
  if (repairCopy) changes.push(`roof repairs: ${repairCopy} sentence(s) that offered repairs reworded`);

  return used;
}
