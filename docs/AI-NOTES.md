# Trippn' — AI notes

These notes are the record of how this app was shaped. They are not a changelog of every edit. A fresh model should read them with `docs/MASTER-PROMPT.md`.

## What it is

Trippn' is a road-trip planner for one trip, not a general travel site.

- Start: Seattle.
- When: 25–29 November (four nights). The dates are exact. Flex of a few days is optional and stays off until someone turns it on.
- Who: 4 adults and 4 children (about ages 7–13). The house should sleep 8, with at least 4 bedrooms.
- Money: about $2,000–$4,000 for the whole stay, not per night.
- Wanted when possible: hot tub, fireplace, kitchen, washer, kid-friendly.
- First choice of town: Leavenworth. Other places are fine if the drive is honest.

The name is **Trippn'** (apostrophe included). It replaced the working title “Ring”.

## How the map should feel

The first drawings were a soft disk of “2.5 hours from Seattle” with a darker wash on the roads. A disk lies. A point inside the shade can be a ferry, a gate, or a slow gravel road.

What shipped instead:

- Reach follows roads. Paved is orange. Unpaved is red. Edges are feathered, not a hard circle.
- A short hike off the road is part of “you can get here”: about 1 mile in one color, up to 4 miles in another.
- The commute-time look to copy is a filled drive-time shape along the network (the way [commutetimemap.com](https://commutetimemap.com) paints reachable land), not their service and not their data.
- Pins are places on that network. The number is minutes of driving from Seattle.
- The map must pan freely, including south and up. An earlier `maxBounds` made a tall view bounce back. That bound is gone.
- No Google or Mapbox key. Tiles are Esri, USGS, and the light-pollution tiles used by lightpollutionmap.app for Night.
- Basemaps: Terrain, Satellite, Streets, USGS, Night.
- Layers, each on or off: Reach, Roads, Places, Temp, Water, Sky, Wind, Smoke, Snow, Trails.
- Water colors stretch between the season’s min and max so a lake and the ocean are not the same blue.
- Temp, wind, smoke, and snow are seasonal models for mid-November unless a live feed is actually loaded. Smoke points at the same idea as AirNow Fire and Smoke / SmokeWx. Do not invent a live plume.
- Trails are pins plus links to AllTrails (hikes) and Trailforks (bikes). Those sites block scrapers. Do not pretend the app contains their full trail database.
- Left dock is the map: layers, places, season. Right dock is stays. Both can be docked to a button so the map is usable.
- “Sync” turns hover-from-list into a map pan. It is a switch, not always on.
- A refresh control redraws the map when the canvas gets stuck.

## Stays

Live calendars for Airbnb, Vrbo, Expedia, and the rest are not in this app. Those sites are JavaScript walls. The app opens a dated search on each site. It does not show a made-up quote for 25–29 November.

Dated search links (the night must still be open): Airbnb, Vrbo, Expedia, Booking, Google, HomeToGo, Kayak, Vacasa, RedAwning, Marriott Homes, Holidu, Whimstay, Recreation.gov, Washington State Parks, Hipcamp.

Book-direct / regional, calendar checked by the person: San Juan Islands, Whidbey & Camano, Mt. Baker chamber, Leavenworth cabins, Wenatchee Valley, Suncadia, Visit Rainier, Visit St. Helens, Beachcombers NW, Long Beach, Port Angeles.

The All page is one list of stops and stay links, with the same filters as the map: price, drive, drawn box, region, category, ferry, party size, amenities, which sites, book-direct.

Price is a nightly histogram with two handles. The numbers are a modeled Thanksgiving asking range for a house that sleeps 8. The copy must say that.

Drive time lives on the left, as “From Seattle — up to N hours,” not as a histogram on the stays side. Letting go of the slider frames the map. The orange and red reach is only the traced roads whose route is inside that drive. It is not a disk and it does not get thicker when you add hours. Past the traced highways, farther towns (Portland, Chelan, and the rest) show as pins once their hours fit. Price stays a nightly histogram on the stays side, and the copy says the numbers are a model.

A box drawn on the map is a deeper mine: only stops inside it, and the wider set of sites.

A saved search can arm a browser notification if a modeled stop newly fits. That is local to the device. It is not a server cron and it will not see a listing that appears only inside Airbnb.

## The shortlist

Ten named houses were picked because a published yearly range could land near $2,000–$4,000 for four nights. They are not held prices.

The list must obey the filters. Default drive max is 3¼ hours (195 minutes), so Chelan at 3.5 hours is off until the window grows. A house whose published nightly range no longer overlaps the price handles drops out. The heading counts how many of the ten still fit (often nine).

Houses, in rank order: Ocean Shores Getaway, Hood Canal waterfront (Union), Wenatchee Oasis, Cle Elum cabins, All About the Lake, The Lookout (Chelan), Westport retreat, Port Angeles houses, Long Beach houses, All Seasons Getaway (Leavenworth). Listing URLs are in `src/data/picks.ts`. Ocean Shores, Port Angeles, and Long Beach have no single public listing, so those cards open a dated Airbnb search of the town for November 25–29. That search is not a held house. The list starts open.

Stars save a house or a stop in `localStorage` (`ring-favorites`). Saved is a filter, not a second inventory.

Each house name opens the card. That card has the listing link, “Show all on map” (gold pins for every house still in the filter, then the map frames them), one photo you can enlarge, and previous/next through the other photos. The photos are houses in that country, not a confirmed picture of that listing. “Remove from saved” drops a starred house. Stars still save a house or a stop in `localStorage` (`ring-favorites`).

## Sharing

The published link should open the map. It should not send a guest through a Google account wall onto a black page. Auth stays off. Favorites and alarms stay on this device.

The GitHub repo is [jaime-espinosa/trippn](https://github.com/jaime-espinosa/trippn).

## What not to fake

- A price for 25–29 November that was not read off a calendar.
- A full AllTrails or Trailforks layer.
- A round drive-time disk.
- “Booked” or “still open” unless the link is the check.
