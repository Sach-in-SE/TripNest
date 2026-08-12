package com.tripnest.component;

import com.tripnest.entity.Destination;
import com.tripnest.repository.DestinationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
public class DestinationDataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DestinationDataSeeder.class);

    @Autowired
    private DestinationRepository destinationRepository;

    @Override
    public void run(String... args) throws Exception {
        logger.info("Initializing production-quality demo destination dataset...");
        List<DestinationSeedDto> seeds = getSeedDataset();

        int seededCount = 0;
        int updatedCount = 0;

        for (DestinationSeedDto dto : seeds) {
            Optional<Destination> existingOpt = destinationRepository
                    .findByNameIgnoreCaseAndStateIgnoreCaseAndCountryIgnoreCase(dto.name.trim(), dto.state.trim(), dto.country.trim())
                    .or(() -> destinationRepository.findByNameIgnoreCase(dto.name.trim()));

            Destination dest;
            if (existingOpt.isPresent()) {
                dest = existingOpt.get();
                updatedCount++;
            } else {
                dest = new Destination();
                seededCount++;
            }

            dest.setName(dto.name);
            dest.setState(dto.state);
            dest.setCountry(dto.country);
            dest.setCategory(dto.category);
            dest.setDescription(dto.description);
            dest.setImageUrl(dto.imageUrl);
            dest.setBestSeason(dto.bestSeason);
            dest.setEstimatedBudget(dto.estimatedBudget);
            dest.setRecommendedDays(dto.recommendedDays);
            dest.setLatitude(dto.latitude);
            dest.setLongitude(dto.longitude);
            dest.setRating(dto.rating);
            dest.setPopular(false);

            destinationRepository.save(dest);
        }

        logger.info("Destination dataset initialization complete. Seeded: {}, Updated: {}, Total DB: {}",
                seededCount, updatedCount, destinationRepository.count());
    }

    private List<DestinationSeedDto> getSeedDataset() {
        List<DestinationSeedDto> list = new ArrayList<>();

        // 1. BEACH (5 destinations)
        list.add(new DestinationSeedDto("Goa", "Goa", "India", "Beach",
                "India's premier beach state featuring golden sand beaches, coconut palm groves, vibrant nightlife, UNESCO-listed Portuguese colonial architecture, and fresh seafood along the Arabian Sea coast.",
                "https://images.unsplash.com/photo-1512343879190-7a5ed04faecf?w=800",
                "November to February", 30000.0, 5, 15.4909, 73.8278, 4.7));

        list.add(new DestinationSeedDto("Kovalam", "Kerala", "India", "Beach",
                "Famous coastal town near Thiruvananthapuram featuring crescent-shaped beaches like Lighthouse Beach, traditional Ayurvedic wellness resorts, and tranquil backwaters.",
                "https://images.unsplash.com/photo-1609216302363-585840f519d0?w=800",
                "September to March", 35000.0, 5, 8.4004, 76.9787, 4.8));

        list.add(new DestinationSeedDto("Andaman Islands", "Andaman and Nicobar", "India", "Beach",
                "An archipelago of tropical islands in the Bay of Bengal boasting crystal-clear turquoise waters, Radhanagar Beach, vibrant coral reefs, and historic Cellular Jail.",
                "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800",
                "October to May", 50000.0, 7, 11.9761, 92.9876, 4.9));

        list.add(new DestinationSeedDto("Puducherry", "Puducherry", "India", "Beach",
                "Charming coastal enclave known for its French Quarter heritage houses, Promenade Beach, Auroville spiritual township, and French-fusion culinary scene.",
                "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800",
                "October to March", 18000.0, 3, 11.9416, 79.8083, 4.5));

        list.add(new DestinationSeedDto("Gokarna", "Karnataka", "India", "Beach",
                "Serene coastal town famous for Om Beach, Kudle Beach, cliffside hiking trails, and the ancient Mahabaleshwar Shiva temple.",
                "https://images.unsplash.com/photo-1600100397608-f010e423b971?w=800",
                "October to March", 15000.0, 3, 14.5479, 74.3188, 4.6));

        // 2. MOUNTAINS (5 destinations)
        list.add(new DestinationSeedDto("Manali", "Himachal Pradesh", "India", "Mountains",
                "Picturesque Himalayan resort town along the Beas River, serving as a gateway to Solang Valley, Rohtang Pass, and High-altitude alpine treks.",
                "https://images.unsplash.com/photo-1626628053695-4609c029e9b6?w=800",
                "March to June", 25000.0, 5, 32.2432, 77.1892, 4.6));

        list.add(new DestinationSeedDto("Shimla", "Himachal Pradesh", "India", "Mountains",
                "Former British summer capital perched on pine-clad hills, featuring Victorian colonial architecture, the Mall Road, Christ Church, and Kalka-Shimla Toy Train.",
                "https://images.unsplash.com/photo-1593162758928-8f5d48432c02?w=800",
                "March to June", 22000.0, 3, 31.1048, 77.1734, 4.5));

        list.add(new DestinationSeedDto("Srinagar", "Jammu and Kashmir", "India", "Mountains",
                "Summer capital of Jammu and Kashmir famous for iconic Dal Lake houseboats, Shikara rides, Mughal Gardens like Shalimar Bagh, and snow-capped Zabarwan hills.",
                "https://images.unsplash.com/photo-1566837945700-30057527ade0?w=800",
                "April to October", 35000.0, 6, 34.0837, 74.7973, 4.9));

        list.add(new DestinationSeedDto("Darjeeling", "West Bengal", "India", "Mountains",
                "World-famous hill resort surrounded by emerald tea plantations, offering Tiger Hill sunrise views of Mount Kanchenjunga and the UNESCO Toy Train.",
                "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800",
                "April to June", 22000.0, 4, 27.0410, 88.2663, 4.7));

        list.add(new DestinationSeedDto("Munnar", "Kerala", "India", "Mountains",
                "Scenic Western Ghats hill station enveloped in rolling tea estates, misty valleys, Anamudi peak, and Eravikulam National Park wildlife.",
                "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800",
                "September to March", 20000.0, 3, 10.0889, 77.0595, 4.7));

        // 3. HISTORICAL (5 destinations)
        list.add(new DestinationSeedDto("Agra", "Uttar Pradesh", "India", "Historical",
                "Historic Mughal capital home to the majestic Taj Mahal, Agra Fort, and nearby Fatehpur Sikri, showcasing world-renowned Indo-Islamic marble architecture.",
                "https://images.unsplash.com/photo-1564507592333-c60657eea5ee?w=800",
                "October to March", 15000.0, 2, 27.1751, 78.0421, 4.8));

        list.add(new DestinationSeedDto("Jaipur", "Rajasthan", "India", "Historical",
                "The Pink City of Rajasthan, famous for Hawa Mahal, hilltop Amber Fort, City Palace, Jantar Mantar observatory, and traditional block-printed crafts.",
                "https://images.unsplash.com/photo-1477584110986-447958bb8a22?w=800",
                "October to March", 20000.0, 3, 26.9124, 75.7873, 4.6));

        list.add(new DestinationSeedDto("Delhi", "Delhi", "India", "Historical",
                "India's capital city blending ancient empires and modern governance, featuring UNESCO monuments Red Fort, Humayun's Tomb, Qutub Minar, and Lotus Temple.",
                "https://images.unsplash.com/photo-1587475915356-5ea01c8d9f3d?w=800",
                "October to March", 25000.0, 4, 28.6139, 77.2090, 4.5));

        list.add(new DestinationSeedDto("Udaipur", "Rajasthan", "India", "Historical",
                "The City of Lakes known for royal romantic palaces, Lake Pichola boat cruises, Jag Mandir, and the towering City Palace complex.",
                "https://images.unsplash.com/photo-1615837137326-0c2132d7870a?w=800",
                "September to March", 25000.0, 3, 24.5854, 73.7125, 4.8));

        list.add(new DestinationSeedDto("Hampi", "Karnataka", "India", "Historical",
                "UNESCO World Heritage site featuring the boulder-strewn ruins of the 14th-century Vijayanagara Empire, Virupaksha Temple, and Stone Chariot.",
                "https://images.unsplash.com/photo-1600100395168-d01c80084363?w=800",
                "October to February", 16000.0, 3, 15.3350, 76.4600, 4.8));

        // 4. ADVENTURE (5 destinations)
        list.add(new DestinationSeedDto("Leh Ladakh", "Ladakh", "India", "Adventure",
                "High-altitude Himalayan desert adventure hub famous for Khardung La motorcycling, Pangong Tso Lake camping, Magnetic Hill, and ancient Buddhist monasteries.",
                "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800",
                "May to September", 45000.0, 7, 34.1526, 77.5771, 4.9));

        list.add(new DestinationSeedDto("Spiti Valley", "Himachal Pradesh", "India", "Adventure",
                "Remote cold desert valley offering high-pass trekking, Key Monastery visits, Chandratal Lake camping, and rugged off-road Himalayan expeditions.",
                "https://images.unsplash.com/photo-1626628053695-4609c029e9b6?w=800",
                "June to September", 35000.0, 6, 32.2461, 78.0349, 4.9));

        list.add(new DestinationSeedDto("Auli", "Uttarakhand", "India", "Adventure",
                "India's premier ski resort village surrounded by coniferous forests and panoramic views of Nanda Devi, Trishul, and Kamet peaks.",
                "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800",
                "December to March", 28000.0, 4, 30.5286, 79.5694, 4.7));

        list.add(new DestinationSeedDto("Cherrapunji", "Meghalaya", "India", "Adventure",
                "Rainforest adventure destination famous for living root bridges, Nohkalikai Falls, caving expeditions, and lush green Meghalayan canyons.",
                "https://images.unsplash.com/photo-1596409755449-473d599613f0?w=800",
                "October to April", 24000.0, 4, 25.2702, 91.7323, 4.8));

        list.add(new DestinationSeedDto("Bir Billing", "Himachal Pradesh", "India", "Adventure",
                "The Paragliding Capital of India, renowned worldwide for tandem paragliding flights from Billing launch pad down to Bir Tibetan colony.",
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
                "September to November", 18000.0, 3, 32.0494, 76.7196, 4.8));

        // 5. SPIRITUAL (5 destinations)
        list.add(new DestinationSeedDto("Varanasi", "Uttar Pradesh", "India", "Spiritual",
                "One of the world's oldest continuously inhabited cities, sacred to Hinduism, famous for Ganga Aarti ceremonies, river ghats, and Kashi Vishwanath Temple.",
                "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800",
                "October to March", 15000.0, 3, 25.3176, 82.9739, 4.8));

        list.add(new DestinationSeedDto("Rishikesh", "Uttarakhand", "India", "Spiritual",
                "Spiritual sanctuary on the banks of the holy Ganges River, known globally for yoga ashrams, Beatles Ashram, Laxman Jhula, and evening Triveni Ghat aarti.",
                "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800",
                "September to April", 18000.0, 4, 30.0869, 78.2676, 4.7));

        list.add(new DestinationSeedDto("Amritsar", "Punjab", "India", "Spiritual",
                "The spiritual center of Sikhism, home to the resplendent Golden Temple (Sri Harmandir Sahib), Langar community kitchen, and Wagah Border ceremony.",
                "https://images.unsplash.com/photo-1609946850022-77ebfb27c731?w=800",
                "October to March", 16000.0, 2, 31.6200, 74.8765, 4.9));

        list.add(new DestinationSeedDto("Madurai", "Tamil Nadu", "India", "Spiritual",
                "Ancient temple city centered around the magnificent Meenakshi Amman Temple with its colorful gopurams and rich Dravidian cultural history.",
                "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800",
                "October to March", 15000.0, 2, 9.9252, 78.1198, 4.7));

        list.add(new DestinationSeedDto("Puri", "Odisha", "India", "Spiritual",
                "Coastal holy city famous for the sacred 12th-century Jagannath Temple, annual Rath Yatra chariot festival, and Golden Beach along the Bay of Bengal.",
                "https://images.unsplash.com/photo-1600100397608-f010e423b971?w=800",
                "October to March", 14000.0, 3, 19.8135, 85.8312, 4.6));

        // 6. WILDLIFE (5 destinations)
        list.add(new DestinationSeedDto("Jim Corbett", "Uttarakhand", "India", "Wildlife",
                "India's oldest national park in the Himalayan foothills, famous for Bengal tiger safaris, wild elephants, Ramganga river ecosystems, and eco-resorts.",
                "https://images.unsplash.com/photo-1575550959106-5a7defe28b56?w=800",
                "November to June", 28000.0, 4, 29.5300, 78.7747, 4.7));

        list.add(new DestinationSeedDto("Ranthambore", "Rajasthan", "India", "Wildlife",
                "Famous tiger reserve set around a 10th-century hill fort, offering prime jungle safaris to spot Royal Bengal tigers, leopards, and marsh crocodiles.",
                "https://images.unsplash.com/photo-1547920979-6ce268d7765b?w=800",
                "October to June", 30000.0, 3, 26.0173, 76.5026, 4.8));

        list.add(new DestinationSeedDto("Kaziranga", "Assam", "India", "Wildlife",
                "UNESCO World Heritage park sanctuary harboring two-thirds of the world's great one-horned rhinoceroses, wild water buffaloes, and Brahmaputra wetlands.",
                "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800",
                "November to April", 26000.0, 3, 26.5775, 93.1711, 4.8));

        list.add(new DestinationSeedDto("Gir National Park", "Gujarat", "India", "Wildlife",
                "The sole natural habitat of the endangered Asiatic Lion in the world, featuring dry deciduous forests, jeep safaris, and diverse bird species.",
                "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=800",
                "December to March", 25000.0, 3, 21.1243, 70.8242, 4.7));

        list.add(new DestinationSeedDto("Bandhavgarh", "Madhya Pradesh", "India", "Wildlife",
                "Renowned tiger sanctuary boasting one of the highest densities of Royal Bengal tigers in India, ancient fort ruins, and sal forest valleys.",
                "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800",
                "October to June", 28000.0, 3, 23.7019, 81.0261, 4.8));

        // 7. CITY (5 destinations)
        list.add(new DestinationSeedDto("Mumbai", "Maharashtra", "India", "City",
                "Dynamic metropolis known as India's financial capital, featuring Marine Drive, Gateway of India, Victoria Terminus, Bollywood studios, and street food.",
                "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800",
                "November to February", 40000.0, 4, 19.0760, 72.8777, 4.5));

        list.add(new DestinationSeedDto("Bengaluru", "Karnataka", "India", "City",
                "The Silicon Valley of India, celebrated for pleasant climate, lush Cubbon Park, Lalbagh Botanical Garden, craft breweries, and tech innovation hubs.",
                "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800",
                "September to February", 25000.0, 3, 12.9716, 77.5946, 4.4));

        list.add(new DestinationSeedDto("Kolkata", "West Bengal", "India", "City",
                "The Cultural Capital of India, famous for Victoria Memorial, Howrah Bridge, iconic yellow taxis, colonial history, and Durga Puja festival celebrations.",
                "https://images.unsplash.com/photo-1558431382-27e303142255?w=800",
                "October to March", 20000.0, 4, 22.5726, 88.3639, 4.6));

        list.add(new DestinationSeedDto("Hyderabad", "Telangana", "India", "City",
                "The City of Pearls, known for the 16th-century Charminar, massive Golconda Fort, world-famous Hyderabadi Biryani, and HITEC City tech corridor.",
                "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800",
                "October to March", 22000.0, 3, 17.3850, 78.4867, 4.6));

        list.add(new DestinationSeedDto("Chennai", "Tamil Nadu", "India", "City",
                "South Indian coastal metropolis famous for Marina Beach, Kapaleeshwarar Temple, Carnatic classical music heritage, and South Indian filter coffee.",
                "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800",
                "November to February", 20000.0, 3, 13.0827, 80.2707, 4.4));

        return list;
    }

    private static class DestinationSeedDto {
        String name;
        String state;
        String country;
        String category;
        String description;
        String imageUrl;
        String bestSeason;
        Double estimatedBudget;
        Integer recommendedDays;
        Double latitude;
        Double longitude;
        Double rating;

        public DestinationSeedDto(String name, String state, String country, String category, String description,
                                  String imageUrl, String bestSeason, Double estimatedBudget, Integer recommendedDays,
                                  Double latitude, Double longitude, Double rating) {
            this.name = name;
            this.state = state;
            this.country = country;
            this.category = category;
            this.description = description;
            this.imageUrl = imageUrl;
            this.bestSeason = bestSeason;
            this.estimatedBudget = estimatedBudget;
            this.recommendedDays = recommendedDays;
            this.latitude = latitude;
            this.longitude = longitude;
            this.rating = rating;
        }
    }
}
