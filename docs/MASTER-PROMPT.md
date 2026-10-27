# Master prompt

Paste this to rebuild Trippn' from an empty app. Read `docs/AI-NOTES.md` beside it. Do not invent prices, calendars, or trail databases.

---

Build **Trippn'** (keep the apostrophe), a dark map for one Seattle road trip.

Trip: 25–29 November, four nights, exact dates. Party is 4 adults and 4 children, so the house sleeps 8 and has at least 4 bedrooms. Budget about $2,000–$4,000 for the whole stay. Prefer a hot tub, fireplace, kitchen, washer, and a kid-friendly house. Leavenworth is the first town. Other towns are fine when the drive is honest.

Map: Leaflet, no API key. Basemaps are Esri terrain, satellite, and streets, USGS topo, and night tiles in the style of lightpollutionmap.app. Layers toggle independently: reach, roads, places, temperature, water, sky glow, wind, smoke, snow, trails. Water colors stretch across that month’s min and max. Temperature, wind, smoke, and snow are mid-November models unless a real feed is loaded. Say so. Trails are pins with links to AllTrails and Trailforks, not a scrape of those sites.

Reach follows roads. Paved is orange, unpaved is red, edges feathered. A pale wash is about a mile to four miles off the road, for a short hike. Do not draw a circle of “hours from Seattle.” A control on the **left** menu, not on the stays side, sets “up to N hours from Seattle” (a slider, not a histogram). The painted roads and the pins are only those inside that drive. Releasing the slider frames the map on that reach. The map must pan freely in every direction, including south.

Left dock: map type, layers, season, the hours control, and the place list, with search, category, and a Sync switch for hover-to-pan. Right dock: stays. Both dock to a button. A refresh redraws a stuck map.

Stays: deep links with the dates, party, and bedrooms filled in. Dated sites: Airbnb, Vrbo, Expedia, Booking, Google, HomeToGo, Kayak, Vacasa, RedAwning, Marriott Homes, Holidu, Whimstay, Recreation.gov, state parks, Hipcamp. Regional book-direct links for the San Juans, Whidbey, Mt. Baker, Leavenworth, Wenatchee, Suncadia, Rainier, St. Helens, the coast, Long Beach, and Port Angeles. Never show a price as if the night were confirmed. Nightly figures are a modeled asking range for a house that sleeps 8. A price histogram with two handles filters that model. Drawing a box on the map mines only the stops inside it. A saved search can arm a browser notification on this device. There is no server cron.

An All page lists every stop that passes the filters, with photos of the country around the stop and the stay links.

Shortlist of ten houses whose published ranges can land near the budget: Ocean Shores Getaway, Hood Canal waterfront at Union, Wenatchee Oasis, Cle Elum cabins, All About the Lake, The Lookout at Chelan, a Westport retreat, Port Angeles houses, Long Beach houses, All Seasons Getaway in Leavenworth. The list drops any house outside the current price, drive, party, region, ferry, category, search, or box. The heading counts how many remain. Each name opens a card with the listing link, “Show all on map” (gold pins, then frame them), one photo that enlarges on click, previous/next through the other photos, and “Remove from saved.” Stars persist in localStorage. Say the photos are houses in that country, not a confirmed shot of that listing.

Look: near-black green, cream type, gold accent, Fraunces for names, Outfit for the UI. The product name is Trippn'. Auth stays off so a shared link opens the map and does not pass through a Google account onto a blank page.
