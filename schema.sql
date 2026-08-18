-- MySQL dump 10.13  Distrib 9.7.1, for Win64 (x86_64)
--
-- Host: localhost    Database: tripnest_db
-- ------------------------------------------------------
-- Server version	9.7.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cost` double DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `end_time` time(6) DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `start_time` time(6) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `type` enum('ACCOMMODATION','ADVENTURE','DINING','OTHER','SHOPPING','SIGHTSEEING','TRANSPORTATION') DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `itinerary_id` bigint DEFAULT NULL,
  `reminder_sent` bit(1) DEFAULT NULL,
  `linked_expense_id` bigint DEFAULT NULL,
  `reminder` enum('NONE','ONE_DAY','ONE_HOUR','THIRTY_MINUTES','TWO_HOURS') DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKqf20g13dpp7lty39nddbfcxsd` (`itinerary_id`),
  KEY `FKq6cjukylkgxdjkm9npk9va2f2` (`user_id`),
  CONSTRAINT `FKq6cjukylkgxdjkm9npk9va2f2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKqf20g13dpp7lty39nddbfcxsd` FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `currency` varchar(100) DEFAULT NULL,
  `remaining_amount` double DEFAULT NULL,
  `spent_amount` double DEFAULT NULL,
  `total_amount` double DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `trip_id` bigint DEFAULT NULL,
  `alert100sent` bit(1) DEFAULT NULL,
  `alert80sent` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKcsajrbhf0r55txdi26qlulcpb` (`trip_id`),
  CONSTRAINT `FKq2m188eq0dc75wi4d67b66yqa` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `destinations`
--

DROP TABLE IF EXISTS `destinations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `destinations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `average_cost` double DEFAULT NULL,
  `best_time_to_visit` varchar(200) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `climate` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `popular` bit(1) NOT NULL,
  `best_season` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `estimated_budget` double DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `rating` double DEFAULT NULL,
  `recommended_days` int DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_destination_name_state_country` (`name`,`state`,`country`)
) ENGINE=InnoDB AUTO_INCREMENT=4004 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` double DEFAULT NULL,
  `category` enum('ENTERTAINMENT','FOOD','HOTEL','MISCELLANEOUS','SHOPPING','TRANSPORTATION') DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `receipt_url` varchar(200) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `trip_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9twvm79qw1voae3xgtn1xq5y9` (`trip_id`),
  KEY `FKhpk0n2cbnfiuu5nrgl0ika3hq` (`user_id`),
  CONSTRAINT `FK9twvm79qw1voae3xgtn1xq5y9` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`),
  CONSTRAINT `FKhpk0n2cbnfiuu5nrgl0ika3hq` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `favorite_destinations`
--

DROP TABLE IF EXISTS `favorite_destinations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorite_destinations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `destination_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK8tf40srfxmxiren0c04augbm` (`user_id`,`destination_id`),
  KEY `FKiqekfny93cwxffau8dhdbxjdv` (`destination_id`),
  CONSTRAINT `FK7io8jac7ajnj45yvpauqitbus` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKiqekfny93cwxffau8dhdbxjdv` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `group_members`
--

DROP TABLE IF EXISTS `group_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_members` (
  `group_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`group_id`,`user_id`),
  KEY `FKnr9qg33qt2ovmv29g4vc3gtdx` (`user_id`),
  CONSTRAINT `FKfalshfvy0vfralcs73qcuoah1` FOREIGN KEY (`group_id`) REFERENCES `travel_groups` (`id`),
  CONSTRAINT `FKnr9qg33qt2ovmv29g4vc3gtdx` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `group_memberships`
--

DROP TABLE IF EXISTS `group_memberships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_memberships` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `joined_at` datetime(6) DEFAULT NULL,
  `role` varchar(20) NOT NULL,
  `group_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `status` varchar(20) NOT NULL,
  `invited_by_id` bigint DEFAULT NULL,
  `invited_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `invited_by_user_id` bigint DEFAULT NULL,
  `trip_permission` enum('EDIT','VIEW') DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK9av1qwqwmki0a1whrqvi26t8t` (`group_id`,`user_id`),
  KEY `FKlq7o99bv8w6paut0ih5yhboia` (`user_id`),
  KEY `FKgywluwirj8dojvulntgp7pn2m` (`invited_by_id`),
  KEY `FK2gfk7nhyuy6f30gvmrrmh5jc2` (`invited_by_user_id`),
  CONSTRAINT `FK2gfk7nhyuy6f30gvmrrmh5jc2` FOREIGN KEY (`invited_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKdto3wwnrapi0mwmr7pabkaefv` FOREIGN KEY (`group_id`) REFERENCES `travel_groups` (`id`),
  CONSTRAINT `FKgywluwirj8dojvulntgp7pn2m` FOREIGN KEY (`invited_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKlq7o99bv8w6paut0ih5yhboia` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `group_messages`
--

DROP TABLE IF EXISTS `group_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` varchar(1000) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  `group_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_group_msg_created` (`group_id`,`created_at`),
  KEY `FKn5qquaksoym7avx54ske9b885` (`user_id`),
  CONSTRAINT `FKggdahvqg37abf8u7lp4lwo2vu` FOREIGN KEY (`group_id`) REFERENCES `travel_groups` (`id`),
  CONSTRAINT `FKn5qquaksoym7avx54ske9b885` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `itineraries`
--

DROP TABLE IF EXISTS `itineraries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itineraries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `trip_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK5x0i0sik3lh1hn5mt3ssifga5` (`trip_id`),
  KEY `FKedy4gxkhapn2hpovc9899u3vt` (`user_id`),
  CONSTRAINT `FK5x0i0sik3lh1hn5mt3ssifga5` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`),
  CONSTRAINT `FKedy4gxkhapn2hpovc9899u3vt` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification_preferences`
--

DROP TABLE IF EXISTS `notification_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_preferences` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activity_reminders` bit(1) NOT NULL,
  `budget_alerts` bit(1) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `group_notifications` bit(1) NOT NULL,
  `trip_reminders` bit(1) NOT NULL,
  `trip_share_notifications` bit(1) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKn2jopkbm16qv3xelbvoyjkd0g` (`user_id`),
  CONSTRAINT `FKt9qjvmcl36i14utm5uptyqg84` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_read` bit(1) NOT NULL,
  `message` varchar(500) DEFAULT NULL,
  `reference_id` bigint DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9y21adhxn0ayjhfocscqox7bh` (`user_id`),
  CONSTRAINT `FK9y21adhxn0ayjhfocscqox7bh` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `expiry_date` datetime(6) DEFAULT NULL,
  `token` varchar(255) DEFAULT NULL,
  `used` bit(1) NOT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK71lqwbwtklmljk3qlsugr1mig` (`token`),
  UNIQUE KEY `UKla2ts67g4oh2sreayswhox1i6` (`user_id`),
  CONSTRAINT `FKk3ndxg5xp6v7wd4gjyusp15gq` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `preference_trip_types`
--

DROP TABLE IF EXISTS `preference_trip_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preference_trip_types` (
  `preference_id` bigint NOT NULL,
  `trip_type` varchar(255) DEFAULT NULL,
  KEY `FKjpimwm5x0cekptq2kuva9x43q` (`preference_id`),
  CONSTRAINT `FKjpimwm5x0cekptq2kuva9x43q` FOREIGN KEY (`preference_id`) REFERENCES `travel_preferences` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` enum('ROLE_ADMIN','ROLE_GROUP_ADMIN','ROLE_TRAVELER') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `travel_documents`
--

DROP TABLE IF EXISTS `travel_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `travel_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `document_type` enum('HOTEL_BOOKING','INSURANCE','OTHER','PHOTO','TICKET','VISA') DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `trip_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKnv8ghwx3fotu0b880owx80huu` (`trip_id`),
  KEY `FK6xs8qocppcl604x5x80lh7knx` (`user_id`),
  CONSTRAINT `FK6xs8qocppcl604x5x80lh7knx` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKnv8ghwx3fotu0b880owx80huu` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `travel_groups`
--

DROP TABLE IF EXISTS `travel_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `travel_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `trip_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKarybc64gntepxxuth5f4eadpx` (`created_by`),
  KEY `FKgw2ne0jraala0pqqftpmtivpv` (`trip_id`),
  CONSTRAINT `FKarybc64gntepxxuth5f4eadpx` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `FKgw2ne0jraala0pqqftpmtivpv` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `travel_memories`
--

DROP TABLE IF EXISTS `travel_memories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `travel_memories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `caption` varchar(2000) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `location_name` varchar(200) DEFAULT NULL,
  `stored_file_name` varchar(255) DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `visibility` enum('PRIVATE','PUBLIC') NOT NULL,
  `destination_id` bigint DEFAULT NULL,
  `trip_id` bigint DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_memory_user_id` (`user_id`),
  KEY `idx_memory_visibility` (`visibility`),
  KEY `idx_memory_trip_id` (`trip_id`),
  KEY `idx_memory_dest_id` (`destination_id`),
  CONSTRAINT `FKhjms6yycob4ltnyyke9m2pgmq` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKid4diyrtlg9vnq6awaqifrdb9` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`),
  CONSTRAINT `FKrl5f4yqc17t3v5me4p3w2hodf` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `travel_preferences`
--

DROP TABLE IF EXISTS `travel_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `travel_preferences` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `preferred_budget_range` varchar(20) DEFAULT NULL,
  `preferred_travel_style` varchar(20) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKfmu23jubn3lhexwmj7ak7t0jv` (`user_id`),
  CONSTRAINT `FK4kq2ynr923yscx37p8m01y65a` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trip_shares`
--

DROP TABLE IF EXISTS `trip_shares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trip_shares` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `permission` enum('EDIT','VIEW') DEFAULT NULL,
  `shared_by_user_id` bigint DEFAULT NULL,
  `shared_with_user_id` bigint DEFAULT NULL,
  `trip_id` bigint DEFAULT NULL,
  `status` enum('ACCEPTED','DECLINED','PENDING') DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKc77flhen8nbed29vs2cmlu4te` (`trip_id`,`shared_with_user_id`),
  KEY `FKpof6ke6u5mr0c0t2kby0mo387` (`shared_by_user_id`),
  KEY `FKrw1y3kjks009gs8x2gj8thih7` (`shared_with_user_id`),
  CONSTRAINT `FKkmrcxo5b5noaeqaq0ceu2be33` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`),
  CONSTRAINT `FKpof6ke6u5mr0c0t2kby0mo387` FOREIGN KEY (`shared_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKrw1y3kjks009gs8x2gj8thih7` FOREIGN KEY (`shared_with_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trips`
--

DROP TABLE IF EXISTS `trips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trips` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `budget` double DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `destination` varchar(100) NOT NULL,
  `end_date` date DEFAULT NULL,
  `number_of_travelers` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `status` enum('CANCELLED','COMPLETED','ONGOING','PLANNING','UPCOMING') DEFAULT NULL,
  `title` varchar(100) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `reminder_sent` bit(1) DEFAULT NULL,
  `reminder24hour_sent` bit(1) DEFAULT NULL,
  `reminder3day_sent` bit(1) DEFAULT NULL,
  `reminder7day_sent` bit(1) DEFAULT NULL,
  `trip_completed_sent` bit(1) DEFAULT NULL,
  `trip_started_sent` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK8wb14dx6ed0bpp3planbay88u` (`user_id`),
  CONSTRAINT `FK8wb14dx6ed0bpp3planbay88u` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `FKh8ciramu9cc9q3qcqiv4ue8a6` (`role_id`),
  CONSTRAINT `FKh8ciramu9cc9q3qcqiv4ue8a6` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `FKhfh9dx7w3ubf1co1vdev94g3f` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `enabled` bit(1) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `password` varchar(120) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `provider` enum('GOOGLE','LOCAL') DEFAULT NULL,
  `profile_picture_url` varchar(500) DEFAULT NULL,
  `accommodation_preference` varchar(50) DEFAULT NULL,
  `bio` varchar(300) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `dream_destination` varchar(100) DEFAULT NULL,
  `email_verified` bit(1) NOT NULL,
  `emergency_contact_name` varchar(100) DEFAULT NULL,
  `emergency_contact_phone` varchar(15) DEFAULT NULL,
  `emergency_contact_relationship` varchar(50) DEFAULT NULL,
  `favorite_destination` varchar(100) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `github` varchar(500) DEFAULT NULL,
  `instagram` varchar(500) DEFAULT NULL,
  `linkedin` varchar(500) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `passport_holder` bit(1) NOT NULL,
  `portfolio` varchar(500) DEFAULT NULL,
  `preferred_transport` varchar(50) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `travel_style` varchar(50) DEFAULT NULL,
  `password_change_required` bit(1) NOT NULL,
  `temporary_password_expiry` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKr43af9ap4edm43mmtq01oddj6` (`username`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-17 23:56:56
