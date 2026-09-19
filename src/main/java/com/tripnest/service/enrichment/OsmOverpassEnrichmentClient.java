package com.tripnest.service.enrichment;

import com.tripnest.dto.TravelGuideResponse;
import com.tripnest.dto.TravelPlace;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
public class OsmOverpassEnrichmentClient implements TravelEnrichmentClient {

    private static final Logger logger = LoggerFactory.getLogger(OsmOverpassEnrichmentClient.class);
    private static final String USER_AGENT = "TripNest-TravelGuide/1.0 (https://tripnest.com; contact@tripnest.com)";
    public static final String OSM_ATTRIBUTION = "© OpenStreetMap contributors & Wikipedia";

    // Public Overpass API mirrors for high availability and failover
    private static final List<String> OVERPASS_MIRRORS = List.of(
            "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
            "https://overpass-api.de/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter",
            "https://overpass.private.coffee/api/interpreter"
    );

    @Autowired
    private RestTemplate restTemplate;

    @Override
    public TravelGuideResponse enrich(String destinationName, String country, Double latitude, Double longitude, double radiusKm, int limitPerCategory) {
        if (latitude == null || longitude == null) {
            return TravelGuideResponse.builder()
                    .attractions(new ArrayList<>())
                    .hotels(new ArrayList<>())
                    .food(new ArrayList<>())
                    .shopping(new ArrayList<>())
                    .available(false)
                    .attribution(OSM_ATTRIBUTION)
                    .build();
        }

        int radiusMeters = (int) Math.max(1000, Math.min(radiusKm * 1000, 50000));
        int limit = Math.max(1, Math.min(limitPerCategory, 20));

        // Category-specific maximum allowable search radii
        double attractionMaxRadiusKm = Math.max(radiusKm * 1.5, 20.0);
        double hotelMaxRadiusKm = Math.max(radiusKm, 15.0);
        double foodMaxRadiusKm = Math.max(radiusKm, 12.0);
        double shoppingMaxRadiusKm = Math.max(radiusKm, 15.0);

        List<TravelPlace> attractions = new ArrayList<>();
        List<TravelPlace> hotels = new ArrayList<>();
        List<TravelPlace> food = new ArrayList<>();
        List<TravelPlace> shopping = new ArrayList<>();

        // 1. Fetch premier heritage & landmark attractions with extracts/images from Wikipedia GeoSearch
        try {
            List<TravelPlace> wikiAttractions = fetchWikipediaGeoAttractions(latitude, longitude, radiusMeters, limit);
            attractions.addAll(wikiAttractions);
        } catch (Exception e) {
            logger.debug("Wikipedia GeoSearch attractions fetch error: {}", e.getMessage());
        }

        // 2. Fetch real POIs from OpenStreetMap Overpass API (Stays, Food, Shopping, Attractions)
        try {
            fetchOsmPois(latitude, longitude, radiusMeters, attractions, hotels, food, shopping, limit);
        } catch (Exception e) {
            logger.warn("OSM Overpass POI enrichment failed for lat={}, lon={}: {}", latitude, longitude, e.getMessage());
        }

        // 3. Fallback / supplementary POI resolution via OpenStreetMap Nominatim for any empty categories
        try {
            fetchNominatimPois(destinationName, latitude, longitude, hotels, food, shopping, attractions,
                    hotelMaxRadiusKm, foodMaxRadiusKm, shoppingMaxRadiusKm, attractionMaxRadiusKm, limit);
        } catch (Exception e) {
            logger.debug("OSM Nominatim POI enrichment error for '{}': {}", destinationName, e.getMessage());
        }

        // 4. Cross-category deduplication, radius enforcement, and data-backed quality-proximity ranking
        Set<String> seenPlaces = new HashSet<>();
        attractions = processAndRankCategoryList(attractions, seenPlaces, attractionMaxRadiusKm, limit);
        hotels = processAndRankCategoryList(hotels, seenPlaces, hotelMaxRadiusKm, limit);
        food = processAndRankCategoryList(food, seenPlaces, foodMaxRadiusKm, limit);
        shopping = processAndRankCategoryList(shopping, seenPlaces, shoppingMaxRadiusKm, limit);

        boolean hasContent = !attractions.isEmpty() || !hotels.isEmpty() || !food.isEmpty() || !shopping.isEmpty();

        return TravelGuideResponse.builder()
                .attractions(attractions)
                .hotels(hotels)
                .food(food)
                .shopping(shopping)
                .available(hasContent)
                .attribution(OSM_ATTRIBUTION)
                .build();
    }

    private void fetchOsmPois(Double lat, Double lon, int radiusMeters,
                              List<TravelPlace> attractions, List<TravelPlace> hotels,
                              List<TravelPlace> food, List<TravelPlace> shopping, int limit) {

        String query = String.format(Locale.US,
                "[out:json][timeout:5];"
                        + "("
                        + "node[\"tourism\"~\"hotel|guest_house|resort|hostel|motel\"][\"name\"](around:%d,%.4f,%.4f);"
                        + "node[\"amenity\"~\"restaurant|cafe|fast_food|food_court|bistro|pub\"][\"name\"](around:%d,%.4f,%.4f);"
                        + "node[\"shop\"~\"mall|department_store|supermarket|gift|craft|jewelry|marketplace|clothes|bazaar|antiques|souvenir\"][\"name\"](around:%d,%.4f,%.4f);"
                        + "node[\"amenity\"=\"marketplace\"][\"name\"](around:%d,%.4f,%.4f);"
                        + "node[\"tourism\"~\"attraction|museum|viewpoint|theme_park|gallery|zoo|aquarium\"][\"name\"](around:%d,%.4f,%.4f);"
                        + "node[\"historic\"~\"monument|memorial|castle|fort|archaeological_site|ruins|palace|city_gate\"][\"name\"](around:%d,%.4f,%.4f);"
                        + ");"
                        + "out 35;",
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon
        );

        Map<?, ?> responseBody = executeOverpassQueryWithFailover(query);
        if (responseBody == null || !responseBody.containsKey("elements")) {
            return;
        }

        List<?> elements = (List<?>) responseBody.get("elements");
        if (elements == null || elements.isEmpty()) {
            return;
        }

        for (Object item : elements) {
            if (!(item instanceof Map<?, ?>)) continue;
            Map<?, ?> elem = (Map<?, ?>) item;

            Number elemLatNum = (Number) elem.get("lat");
            Number elemLonNum = (Number) elem.get("lon");
            Number idNum = (Number) elem.get("id");
            if (elemLatNum == null || elemLonNum == null) continue;

            double elemLat = elemLatNum.doubleValue();
            double elemLon = elemLonNum.doubleValue();
            double distanceKm = calculateHaversineDistance(lat, lon, elemLat, elemLon);

            if (!(elem.get("tags") instanceof Map<?, ?>)) continue;
            Map<?, ?> tags = (Map<?, ?>) elem.get("tags");

            String name = (String) tags.get("name");
            if (name == null || name.trim().isEmpty()) {
                name = (String) tags.get("name:en");
            }
            if (name == null || name.trim().isEmpty()) continue;
            name = name.trim();

            String website = (String) tags.get("website");
            if (website == null) website = (String) tags.get("url");
            if (website != null && !website.startsWith("http://") && !website.startsWith("https://")) {
                website = "https://" + website;
            }

            String pageUrl = (website != null && !website.trim().isEmpty())
                    ? website
                    : "https://www.openstreetmap.org/node/" + (idNum != null ? idNum.longValue() : "");

            String phone = (String) tags.get("phone");
            if (phone == null) phone = (String) tags.get("contact:phone");

            String address = buildAddressString(tags);

            String tourism = (String) tags.get("tourism");
            String amenity = (String) tags.get("amenity");
            String historic = (String) tags.get("historic");
            String shop = (String) tags.get("shop");
            String stars = (String) tags.get("stars");
            String cuisine = (String) tags.get("cuisine");

            // Category assignment & snippet generation
            if (tourism != null && isHotelType(tourism)) {
                String snippet = (stars != null ? stars + "-Star " : "")
                        + formatHotelType(tourism)
                        + (address != null ? " • " + address : "");
                hotels.add(TravelPlace.builder()
                        .title(name)
                        .snippet(snippet)
                        .category("HOTEL")
                        .pageUrl(pageUrl)
                        .distanceKm(distanceKm)
                        .latitude(elemLat)
                        .longitude(elemLon)
                        .address(address)
                        .phone(phone)
                        .website(website)
                        .build());
            } else if (amenity != null && isFoodType(amenity)) {
                String snippet = (cuisine != null ? capitalize(cuisine) + " Cuisine • " : "")
                        + ("cafe".equalsIgnoreCase(amenity) ? "Cafe & Coffee" : "Restaurant & Dining");
                food.add(TravelPlace.builder()
                        .title(name)
                        .snippet(snippet)
                        .category("FOOD")
                        .pageUrl(pageUrl)
                        .distanceKm(distanceKm)
                        .latitude(elemLat)
                        .longitude(elemLon)
                        .address(address)
                        .phone(phone)
                        .website(website)
                        .build());
            } else if (shop != null || "marketplace".equalsIgnoreCase(amenity)) {
                String snippet = "marketplace".equalsIgnoreCase(amenity)
                        ? "Local Market & Bazaar"
                        : (capitalize(shop != null ? shop : "Shopping") + " • Retail & Shopping");
                shopping.add(TravelPlace.builder()
                        .title(name)
                        .snippet(snippet)
                        .category("SHOPPING")
                        .pageUrl(pageUrl)
                        .distanceKm(distanceKm)
                        .latitude(elemLat)
                        .longitude(elemLon)
                        .address(address)
                        .phone(phone)
                        .website(website)
                        .build());
            } else if (historic != null || (tourism != null && isAttractionType(tourism))) {
                String snippet = historic != null
                        ? "Historic " + capitalize(historic) + " • Cultural Landmark"
                        : capitalize(tourism) + " • Point of Interest";
                attractions.add(TravelPlace.builder()
                        .title(name)
                        .snippet(snippet)
                        .category("ATTRACTION")
                        .pageUrl(pageUrl)
                        .distanceKm(distanceKm)
                        .latitude(elemLat)
                        .longitude(elemLon)
                        .address(address)
                        .phone(phone)
                        .website(website)
                        .build());
            }
        }
    }

    private static final Object NOMINATIM_LOCK = new Object();
    private static volatile long lastNominatimTimeMs = 0L;

    private void fetchNominatimPois(String destinationName, Double centerLat, Double centerLon,
                                    List<TravelPlace> hotels, List<TravelPlace> food,
                                    List<TravelPlace> shopping, List<TravelPlace> attractions,
                                    double hotelRadius, double foodRadius, double shoppingRadius, double attractionRadius,
                                    int limit) {
        if (destinationName == null || destinationName.trim().isEmpty()) return;
        String dest = destinationName.trim();

        if (hotels.isEmpty()) {
            fetchNominatimCategory("hotel in " + dest, "HOTEL", "Hotel & Accommodation", centerLat, centerLon, hotelRadius, hotels, limit);
            if (hotels.size() < limit) {
                fetchNominatimCategory("resort in " + dest, "HOTEL", "Resort & Stay", centerLat, centerLon, hotelRadius, hotels, limit);
            }
        }
        if (food.isEmpty()) {
            fetchNominatimCategory("restaurants in " + dest, "FOOD", "Restaurant & Dining", centerLat, centerLon, foodRadius, food, limit);
            if (food.size() < limit) {
                fetchNominatimCategory("cafe in " + dest, "FOOD", "Cafe & Eatery", centerLat, centerLon, foodRadius, food, limit);
            }
        }
        if (shopping.isEmpty()) {
            fetchNominatimCategory("shopping mall in " + dest, "SHOPPING", "Shopping Mall & Retail", centerLat, centerLon, shoppingRadius, shopping, limit);
            if (shopping.size() < limit) {
                fetchNominatimCategory("bazaar in " + dest, "SHOPPING", "Local Bazaar & Market", centerLat, centerLon, shoppingRadius, shopping, limit);
            }
        }
        if (attractions.size() < 3) {
            fetchNominatimCategory("monuments in " + dest, "ATTRACTION", "Historic Monument & Attraction", centerLat, centerLon, attractionRadius, attractions, limit);
        }
    }

    private void fetchNominatimCategory(String query, String category, String defaultSnippet,
                                        Double centerLat, Double centerLon, double maxRadiusKm,
                                        List<TravelPlace> targetList, int limit) {
        synchronized (NOMINATIM_LOCK) {
            long now = System.currentTimeMillis();
            long elapsed = now - lastNominatimTimeMs;
            if (elapsed < 1000L) {
                try {
                    Thread.sleep(1000L - elapsed);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
            lastNominatimTimeMs = System.currentTimeMillis();
        }
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = "https://nominatim.openstreetmap.org/search?q=" + encodedQuery + "&format=json&limit=" + (limit + 5);

            java.net.URI uri = java.net.URI.create(url);
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            headers.set("Accept", "application/json");
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<List> response = restTemplate.exchange(uri, HttpMethod.GET, requestEntity, List.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<?> items = response.getBody();
                for (Object obj : items) {
                    if (!(obj instanceof Map<?, ?>)) continue;
                    Map<?, ?> item = (Map<?, ?>) obj;

                    String name = (String) item.get("name");
                    String displayName = (String) item.get("display_name");
                    if (name == null || name.trim().isEmpty()) {
                        name = displayName != null ? displayName.split(",")[0].trim() : null;
                    }
                    if (name == null || name.trim().isEmpty()) continue;

                    String itemClass = (String) item.get("class");
                    String itemType = (String) item.get("type");

                    // Filter out infrastructure / roads / non-venue items
                    if (isIrrelevantOsmType(itemClass, itemType, name)) {
                        continue;
                    }

                    String latStr = (String) item.get("lat");
                    String lonStr = (String) item.get("lon");
                    Double itemLat = latStr != null ? Double.parseDouble(latStr) : null;
                    Double itemLon = lonStr != null ? Double.parseDouble(lonStr) : null;

                    Double distKm = (centerLat != null && centerLon != null && itemLat != null && itemLon != null)
                            ? calculateHaversineDistance(centerLat, centerLon, itemLat, itemLon)
                            : null;

                    // Enforce maximum category radius to eliminate distant outliers
                    if (distKm != null && distKm > maxRadiusKm) {
                        continue;
                    }

                    Number osmIdNum = (Number) item.get("osm_id");
                    String osmType = (String) item.get("osm_type");
                    String pageUrl = (osmIdNum != null && osmType != null)
                            ? "https://www.openstreetmap.org/" + osmType + "/" + osmIdNum
                            : "https://www.openstreetmap.org";

                    String snippet = (itemType != null && !itemType.equalsIgnoreCase("yes") && !itemType.equalsIgnoreCase("no"))
                            ? capitalize(itemType) + " • " + defaultSnippet
                            : defaultSnippet;

                    targetList.add(TravelPlace.builder()
                            .title(name)
                            .snippet(snippet)
                            .category(category)
                            .address(displayName)
                            .pageUrl(pageUrl)
                            .distanceKm(distKm)
                            .latitude(itemLat)
                            .longitude(itemLon)
                            .build());
                }
            }
        } catch (Exception e) {
            logger.debug("Nominatim search failed for '{}': {}", query, e.getMessage());
        }
    }

    private List<TravelPlace> fetchWikipediaGeoAttractions(Double lat, Double lon, int radiusMeters, int limit) {
        List<TravelPlace> list = new ArrayList<>();
        try {
            String geoUrl = String.format(Locale.US,
                    "https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=%.4f|%.4f&gsradius=%d&gslimit=%d&format=json",
                    lat, lon, Math.min(radiusMeters, 25000), Math.min(limit + 6, 16));

            Map<?, ?> res = executeGetApiCall(geoUrl);
            if (res != null && res.containsKey("query")) {
                Map<?, ?> query = (Map<?, ?>) res.get("query");
                if (query.containsKey("geosearch")) {
                    List<?> geoList = (List<?>) query.get("geosearch");
                    int summaryFetchCount = 0;
                    for (Object item : geoList) {
                        if (!(item instanceof Map<?, ?>)) continue;
                        Map<?, ?> m = (Map<?, ?>) item;
                        String title = (String) m.get("title");
                        Number distNum = (Number) m.get("dist");
                        Number itemLat = (Number) m.get("lat");
                        Number itemLon = (Number) m.get("lon");
                        Double distKm = distNum != null ? Math.round(distNum.doubleValue() / 100.0) / 10.0 : null;

                        if (title != null && !title.trim().isEmpty()) {
                            // Filter out non-attraction administrative or infrastructure articles
                            if (isIrrelevantWikipediaTitle(title)) {
                                continue;
                            }

                            // Fetch summary extract and image for rich display (bounded to top 4)
                            String snippet = "Notable cultural landmark and point of interest.";
                            String imageUrl = null;
                            String pageUrl = "https://en.wikipedia.org/wiki/" + URLEncoder.encode(title.replace(' ', '_'), StandardCharsets.UTF_8);

                            if (summaryFetchCount < 4) {
                                summaryFetchCount++;
                                try {
                                    String summaryUrl = "https://en.wikipedia.org/api/rest_v1/page/summary/" + URLEncoder.encode(title, StandardCharsets.UTF_8);
                                    Map<?, ?> summaryRes = executeGetApiCall(summaryUrl);
                                    if (summaryRes != null) {
                                        if (summaryRes.containsKey("extract")) {
                                            String extract = (String) summaryRes.get("extract");
                                            if (extract != null && !extract.trim().isEmpty()) {
                                                snippet = cleanSnippetText(extract, 160);
                                            }
                                        }
                                        if (summaryRes.containsKey("thumbnail")) {
                                            Map<?, ?> thumb = (Map<?, ?>) summaryRes.get("thumbnail");
                                            if (thumb != null && thumb.containsKey("source")) {
                                                imageUrl = (String) thumb.get("source");
                                            }
                                        }
                                    }
                                } catch (Exception ex) {
                                    logger.debug("Wikipedia summary fetch error for {}: {}", title, ex.getMessage());
                                }
                            }

                            list.add(TravelPlace.builder()
                                    .title(title)
                                    .snippet(snippet)
                                    .category("ATTRACTION")
                                    .imageUrl(imageUrl)
                                    .pageUrl(pageUrl)
                                    .distanceKm(distKm)
                                    .latitude(itemLat != null ? itemLat.doubleValue() : null)
                                    .longitude(itemLon != null ? itemLon.doubleValue() : null)
                                    .build());
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.debug("Wikipedia GeoSearch execution error: {}", e.getMessage());
        }
        return list;
    }

    private List<TravelPlace> processAndRankCategoryList(List<TravelPlace> list, Set<String> seenPlaces, double maxRadiusKm, int limit) {
        if (list == null || list.isEmpty()) return new ArrayList<>();

        Map<String, TravelPlace> candidateMap = new LinkedHashMap<>();
        for (TravelPlace place : list) {
            if (place.getTitle() == null || place.getTitle().trim().isEmpty()) continue;
            if (place.getDistanceKm() != null && place.getDistanceKm() > maxRadiusKm) continue;

            String normKey = normalizePlaceName(place.getTitle());
            if (normKey.isEmpty()) continue;

            if (seenPlaces.contains(normKey)) {
                continue;
            }

            if (!candidateMap.containsKey(normKey)) {
                candidateMap.put(normKey, place);
            } else {
                // If candidate already exists in this category, keep the one with richer metadata
                TravelPlace existing = candidateMap.get(normKey);
                if (computePlaceRichness(place) > computePlaceRichness(existing)) {
                    candidateMap.put(normKey, place);
                }
            }
        }

        List<TravelPlace> candidates = new ArrayList<>(candidateMap.values());

        // Objective Data-Quality + Proximity Ranking
        candidates.sort((a, b) -> {
            double scoreA = computeRankingScore(a);
            double scoreB = computeRankingScore(b);
            int scoreComparison = Double.compare(scoreB, scoreA);
            if (scoreComparison != 0) return scoreComparison;

            if (a.getDistanceKm() == null && b.getDistanceKm() == null) return 0;
            if (a.getDistanceKm() == null) return 1;
            if (b.getDistanceKm() == null) return -1;
            return Double.compare(a.getDistanceKm(), b.getDistanceKm());
        });

        List<TravelPlace> result = new ArrayList<>();
        for (TravelPlace place : candidates) {
            if (result.size() >= limit) break;
            result.add(place);
            seenPlaces.add(normalizePlaceName(place.getTitle()));
        }

        return result;
    }

    private double computeRankingScore(TravelPlace place) {
        double score = 0.0;

        // Proximity contribution (closer is better, max 50 points)
        if (place.getDistanceKm() != null) {
            score += Math.max(0.0, 50.0 - (place.getDistanceKm() * 2.0));
        } else {
            score += 20.0;
        }

        // Data completeness contribution (max 50 points)
        if (place.getImageUrl() != null && !place.getImageUrl().trim().isEmpty()) {
            score += 20.0;
        }
        if (place.getSnippet() != null && place.getSnippet().length() > 30) {
            score += 10.0;
        }
        if (place.getWebsite() != null && !place.getWebsite().trim().isEmpty()) {
            score += 10.0;
        }
        if (place.getAddress() != null && place.getAddress().length() > 10) {
            score += 5.0;
        }
        if (place.getPhone() != null && !place.getPhone().trim().isEmpty()) {
            score += 5.0;
        }

        return score;
    }

    private int computePlaceRichness(TravelPlace place) {
        int richness = 0;
        if (place.getImageUrl() != null) richness += 3;
        if (place.getWebsite() != null) richness += 2;
        if (place.getAddress() != null) richness += 2;
        if (place.getPhone() != null) richness += 1;
        if (place.getSnippet() != null) richness += 1;
        return richness;
    }

    private String normalizePlaceName(String title) {
        if (title == null) return "";
        String clean = title.replaceAll("\\([^)]*\\)", ""); // Remove parenthesized subtitles
        clean = clean.replaceAll("[^a-zA-Z0-9\\s]", " "); // Remove punctuation
        clean = clean.replaceAll("\\s+", " ").trim().toLowerCase();
        return clean;
    }

    private boolean isIrrelevantWikipediaTitle(String title) {
        if (title == null) return true;
        String lower = title.toLowerCase();
        return lower.contains("district")
                || lower.contains("constituency")
                || lower.contains("division")
                || lower.contains("tehsil")
                || lower.contains("subdivision")
                || lower.contains("municipal corporation")
                || lower.contains("municipality")
                || lower.contains("vidhan sabha")
                || lower.contains("lok sabha")
                || lower.contains("census town")
                || lower.contains("railway division")
                || lower.contains("police station")
                || lower.contains("headquarters")
                || lower.contains("post office")
                || lower.contains("state highway")
                || lower.contains("national highway")
                || lower.contains("toll plaza")
                || lower.contains("bypass");
    }

    private boolean isIrrelevantOsmType(String itemClass, String itemType, String name) {
        if (itemClass != null) {
            String lowerClass = itemClass.toLowerCase();
            if (lowerClass.equals("highway") || lowerClass.equals("boundary")
                    || lowerClass.equals("railway") || lowerClass.equals("landuse")
                    || lowerClass.equals("administrative")) {
                return true;
            }
        }
        if (itemType != null) {
            String lowerType = itemType.toLowerCase();
            if (lowerType.equals("primary") || lowerType.equals("secondary") || lowerType.equals("tertiary")
                    || lowerType.equals("residential") || lowerType.equals("service") || lowerType.equals("unclassified")
                    || lowerType.equals("track") || lowerType.equals("path") || lowerType.equals("footway")
                    || lowerType.equals("roof") || lowerType.equals("administrative") || lowerType.equals("bus_stop")
                    || lowerType.equals("parking") || lowerType.equals("fuel") || lowerType.equals("car_repair")
                    || lowerType.equals("tyres") || lowerType.equals("chemist") || lowerType.equals("laundry")
                    || lowerType.equals("taxi") || lowerType.equals("taxi_stand") || lowerType.equals("car_wash")
                    || lowerType.equals("car_parts") || lowerType.equals("atm") || lowerType.equals("bank")
                    || lowerType.equals("hospital") || lowerType.equals("clinic") || lowerType.equals("pharmacy")
                    || lowerType.equals("toilets") || lowerType.equals("bench") || lowerType.equals("waste_basket")) {
                return true;
            }
        }
        if (name != null) {
            String lowerName = name.toLowerCase();
            if (lowerName.endsWith(" road") || lowerName.endsWith(" marg") || lowerName.endsWith(" street")
                    || lowerName.endsWith(" highway") || lowerName.endsWith(" flyover") || lowerName.endsWith(" lane")
                    || lowerName.endsWith(" bypass") || lowerName.equals("shopping mall")
                    || lowerName.contains("taxi stand") || lowerName.contains("taxi rank") || lowerName.contains("bus stand")) {
                if ("highway".equalsIgnoreCase(itemClass) || "shop".equalsIgnoreCase(itemClass)
                        || "amenity".equalsIgnoreCase(itemClass) || ("yes".equalsIgnoreCase(itemType) || itemType == null)) {
                    return true;
                }
            }
        }
        return false;
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double clampedA = Math.min(1.0, Math.max(0.0, a));
        double c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
        return Math.round(R * c * 10.0) / 10.0;
    }

    private boolean isHotelType(String tourism) {
        return "hotel".equalsIgnoreCase(tourism)
                || "guest_house".equalsIgnoreCase(tourism)
                || "resort".equalsIgnoreCase(tourism)
                || "hostel".equalsIgnoreCase(tourism)
                || "motel".equalsIgnoreCase(tourism);
    }

    private boolean isFoodType(String amenity) {
        return "restaurant".equalsIgnoreCase(amenity)
                || "cafe".equalsIgnoreCase(amenity)
                || "fast_food".equalsIgnoreCase(amenity)
                || "food_court".equalsIgnoreCase(amenity)
                || "bistro".equalsIgnoreCase(amenity)
                || "pub".equalsIgnoreCase(amenity);
    }

    private boolean isAttractionType(String tourism) {
        return "attraction".equalsIgnoreCase(tourism)
                || "museum".equalsIgnoreCase(tourism)
                || "viewpoint".equalsIgnoreCase(tourism)
                || "theme_park".equalsIgnoreCase(tourism)
                || "gallery".equalsIgnoreCase(tourism)
                || "zoo".equalsIgnoreCase(tourism)
                || "aquarium".equalsIgnoreCase(tourism);
    }

    private String formatHotelType(String tourism) {
        if ("guest_house".equalsIgnoreCase(tourism)) return "Guest House";
        if ("resort".equalsIgnoreCase(tourism)) return "Resort & Spa";
        if ("hostel".equalsIgnoreCase(tourism)) return "Traveler Hostel";
        if ("motel".equalsIgnoreCase(tourism)) return "Motel & Lodge";
        return "Hotel & Accommodation";
    }

    private String buildAddressString(Map<?, ?> tags) {
        String full = (String) tags.get("addr:full");
        if (full != null && !full.trim().isEmpty()) return full.trim();

        String street = (String) tags.get("addr:street");
        String city = (String) tags.get("addr:city");
        if (street != null && city != null) return street + ", " + city;
        if (street != null) return street;
        if (city != null) return city;
        return null;
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return "";
        String clean = str.replace('_', ' ').trim();
        if (clean.length() <= 1) return clean.toUpperCase();
        return Character.toUpperCase(clean.charAt(0)) + clean.substring(1);
    }

    private String cleanSnippetText(String raw, int maxLength) {
        if (raw == null) return "";
        String clean = raw.replaceAll("<[^>]*>", "").replaceAll("&quot;", "\"").replaceAll("&amp;", "&").replaceAll("&#039;", "'");
        clean = clean.replaceAll("\\s+", " ").trim();
        if (clean.length() > maxLength) {
            return clean.substring(0, maxLength - 3) + "...";
        }
        return clean;
    }

    private Map<?, ?> executeOverpassQueryWithFailover(String query) {
        for (String mirrorUrl : OVERPASS_MIRRORS) {
            try {
                java.net.URI uri = java.net.URI.create(mirrorUrl);
                HttpHeaders headers = new HttpHeaders();
                headers.set("User-Agent", USER_AGENT);
                headers.set("Accept", "application/json");
                headers.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);

                org.springframework.util.MultiValueMap<String, String> formBody = new org.springframework.util.LinkedMultiValueMap<>();
                formBody.add("data", query);
                HttpEntity<org.springframework.util.MultiValueMap<String, String>> requestEntity = new HttpEntity<>(formBody, headers);

                ResponseEntity<Map> response = restTemplate.exchange(uri, HttpMethod.POST, requestEntity, Map.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    return response.getBody();
                }
            } catch (Exception e) {
                logger.warn("Overpass mirror '{}' failed: {}. Trying next mirror...", mirrorUrl, e.getMessage());
            }
        }
        logger.warn("All Overpass API mirrors were exhausted or unavailable for query.");
        return null;
    }

    private Map<?, ?> executeGetApiCall(String url) {
        try {
            java.net.URI uri = java.net.URI.create(url);
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            headers.set("Accept", "application/json");
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(uri, HttpMethod.GET, requestEntity, Map.class);
            return response.getBody();
        } catch (Exception e) {
            logger.debug("External GET call failed for {}: {}", url, e.getMessage());
            return null;
        }
    }
}
