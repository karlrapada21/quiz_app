/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

--
-- Table structure for table `passwordresettokens`
--

DROP TABLE IF EXISTS `passwordresettokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `passwordresettokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `userType` enum('user','teacher') NOT NULL,
  `token` varchar(255) NOT NULL,
  `expiresAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `passwordresettokens`
--

LOCK TABLES `passwordresettokens` WRITE;
/*!40000 ALTER TABLE `passwordresettokens` DISABLE KEYS */;
INSERT INTO `passwordresettokens` VALUES
(1,7,'user','a4f8ba62bbc25291825ed2e227be2f9c6eb9372cfa2a13d6a9026b756cc10a65','2025-09-12 23:38:54'),
(2,7,'user','0dd92d3bdc2b51bb516b97767c23d250088c3a51538f838a6fa673edc2718143','2025-09-12 23:39:40'),
(3,7,'user','db3aa6604c97960cfa6500e34197274ecd98c765e4083b8b3e1b5565c847bbfe','2025-09-12 23:39:41'),
(7,17,'user','1ff08c96a9b5329341baa8be1c8e626b361e4075651f1cd5c4ad28a74679e16e','2025-10-24 01:39:46'),
(10,31,'user','a9b754f83234a1d0fdf8fa67d1cbba7ed72e2956263a647ab27c0dbea938b320','2025-10-24 01:48:22');
/*!40000 ALTER TABLE `passwordresettokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizscores`
--

DROP TABLE IF EXISTS `quizscores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quizscores` (
  `ScoreID` int(11) NOT NULL AUTO_INCREMENT,
  `UserID` int(11) NOT NULL,
  `QuizName` varchar(100) NOT NULL,
  `Score` int(11) NOT NULL,
  `Total` int(11) NOT NULL,
  PRIMARY KEY (`ScoreID`),
  KEY `QuizScores_ibfk_1` (`UserID`),
  CONSTRAINT `QuizScores_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=237 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizscores`
--

LOCK TABLES `quizscores` WRITE;
/*!40000 ALTER TABLE `quizscores` DISABLE KEYS */;
INSERT INTO `quizscores` VALUES
(225,50,'Checkbox Quiz',0,2),
(226,49,'Checkbox Quiz',2,2),
(227,50,'Open Ended Quiz',89,100),
(228,50,'Open Ended Quiz',89,100),
(229,50,'Open Ended Quiz',89,100),
(230,50,'Open Ended Quiz',89,100),
(231,49,'Open Ended Quiz',50,100),
(232,49,'Open Ended Quiz',50,100),
(233,50,'Q1 Check Your Knowledge 1',1,5),
(234,50,'Identification Quiz',0,2),
(235,49,'Identification Quiz',2,2),
(236,49,'Q4 Process What You Know 2',1,5);
/*!40000 ALTER TABLE `quizscores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizuseranswers`
--

DROP TABLE IF EXISTS `quizuseranswers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quizuseranswers` (
  `AnswerID` int(11) NOT NULL AUTO_INCREMENT,
  `UserID` int(11) NOT NULL,
  `QuizName` varchar(100) NOT NULL,
  `Answers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`Answers`)),
  `SubmittedAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`AnswerID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `quizuseranswers_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizuseranswers`
--

LOCK TABLES `quizuseranswers` WRITE;
/*!40000 ALTER TABLE `quizuseranswers` DISABLE KEYS */;
INSERT INTO `quizuseranswers` VALUES
(143,50,'Checkbox Quiz','[[0],[0]]','2026-03-25 15:24:53'),
(144,49,'Checkbox Quiz','[[1,2],[0,2,3]]','2026-03-25 15:25:21'),
(145,50,'Open Ended Quiz','[\"zdfgzdg\"]','2026-03-25 15:25:43'),
(146,49,'Open Ended Quiz','[\"zdrgzsdrg\"]','2026-03-25 15:25:50'),
(147,50,'Q1 Check Your Knowledge 1','[0,1,1,1,1]','2026-03-25 15:27:04'),
(148,50,'Identification Quiz','[\"mars\",\"phosynthesis\"]','2026-03-25 15:40:30'),
(149,49,'Identification Quiz','[\"Jupiter\",\"photosynthesis\"]','2026-03-25 15:41:55'),
(150,49,'Q4 Process What You Know 2','[\"ignorance is bliss\"]','2026-03-25 15:47:44');
/*!40000 ALTER TABLE `quizuseranswers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizzes`
--

DROP TABLE IF EXISTS `quizzes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quizzes` (
  `QuizID` int(11) NOT NULL AUTO_INCREMENT,
  `QuizName` varchar(100) NOT NULL,
  `QuestionText` text NOT NULL,
  `OptionsJSON` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`OptionsJSON`)),
  `AnswerJSON` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`AnswerJSON`)),
  `QuestionType` enum('multiple-choice','identification','open-ended','true-false') DEFAULT 'open-ended',
  `TotalPoints` int(11) DEFAULT 1,
  `QuestionOrder` int(11) DEFAULT 0,
  `CreatedAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`QuizID`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizzes`
--

LOCK TABLES `quizzes` WRITE;
/*!40000 ALTER TABLE `quizzes` DISABLE KEYS */;
INSERT INTO `quizzes` VALUES
(1,'Checkbox Quiz','Which of the following are fruits?','[\"Carrot\",\"Apple\",\"Banana\",\"Potato\"]','[1,2]','multiple-choice',1,1,'2025-10-27 23:46:13'),
(2,'Checkbox Quiz','Select the colors that are primary colors.','[\"Red\",\"Green\",\"Blue\",\"Yellow\"]','[0,2,3]','multiple-choice',1,2,'2025-10-27 23:46:13'),
(3,'Multiple Choice Quiz','Habitable planet?','[\"Jupiter\",\"Mars\",\"Earth\",\"Venus\"]','2','multiple-choice',1,1,'2025-10-27 23:57:00'),
(4,'Multiple Choice Quiz','Which planet is known as the Red Planet?','[\"Earth\",\"Mars\",\"Jupiter\",\"Venus\"]','1','multiple-choice',1,2,'2025-10-27 23:57:00'),
(5,'Identification Quiz','What is the largest planet in our solar system?',NULL,'\"jupiter\"','identification',1,1,'2025-10-27 23:57:00'),
(6,'Identification Quiz','What is the process by which plants make their food?',NULL,'\"photosynthesis\"','identification',1,2,'2025-10-27 23:57:00'),
(7,'Open Ended Quiz','Describe the water cycle in your own words.',NULL,NULL,'open-ended',100,1,'2025-10-27 23:57:00'),
(8,'Q1 Check Your Knowledge 1','Which of the following statements is not true?','[\"Food contains energy that is needed by all organisms.\",\"Autotrophs do not need energy because they can produce their own food.\",\"Heterotrophs feed on the autotrophs and other heterotrophs to gain energy.\",\"Energy is essential to all organisms.\"]','1','multiple-choice',1,1,'2025-10-28 00:07:06'),
(9,'Q1 Check Your Knowledge 1','Which is considered an autotroph?','[\"virus\",\"chemosynthetic bacteria\",\"lion\",\"mushroom\"]','1','multiple-choice',1,2,'2025-10-28 00:07:06'),
(10,'Q1 Check Your Knowledge 1','Why is endergonic reaction important?','[\"it breaks down and releases the energy of glucose.\",\"it dephosphorylates ATP to ADP.\",\"it converts light energy to chemical energy.\",\"it oxidizes NADH to NAD⁺.\"]','2','multiple-choice',1,3,'2025-10-28 00:07:06'),
(11,'Q1 Check Your Knowledge 1','The following does not show catabolism except:','[\"glucose ATP\",\"glucose to disaccharides\",\"FAD to FADH₂\",\"pyruvic acid to lactic acid\"]','3','multiple-choice',1,4,'2025-10-28 00:07:06'),
(12,'Q1 Check Your Knowledge 1','Which is considered a molecule?','[\"NAD⁺\",\"FAD\",\"NADP⁺\",\"NADH\"]','3','multiple-choice',1,5,'2025-10-28 00:07:06'),
(13,'Q1 Check Your Knowledge 2','High-energy organic molecule formed during the dark reaction.','[\"stomata\",\"antenna molecules\",\"glucose\",\"photons\",\"electron carrier molecules\",\"photosystem II\",\"photosystem I\",\"RUDP5\",\"PGAL\",\"thylakoids\",\"chlorophyll\",\"stroma\",\"chloroplast\"]','[8]','multiple-choice',1,1,'2025-10-28 00:07:24'),
(14,'Q1 Check Your Knowledge 2','Carbon dioxide acceptor.','[\"stomata\",\"antenna molecules\",\"glucose\",\"photons\",\"electron carrier molecules\",\"photosystem II\",\"photosystem I\",\"RUDP5\",\"PGAL\",\"thylakoids\",\"chlorophyll\",\"stroma\",\"chloroplast\"]','[7]','multiple-choice',1,2,'2025-10-28 00:07:24'),
(15,'Q1 Check Your Knowledge 2','Photosystem whose reaction center is P680','[\"stomata\",\"antenna molecules\",\"glucose\",\"photons\",\"electron carrier molecules\",\"photosystem II\",\"photosystem I\",\"RUDP5\",\"PGAL\",\"thylakoids\",\"chlorophyll\",\"stroma\",\"chloroplast\"]','[5]','multiple-choice',1,3,'2025-10-28 00:07:24'),
(16,'Q1 Check Your Knowledge 2','Tiny openings in the leaf where carbon dioxide enters.','[\"stomata\",\"antenna molecules\",\"glucose\",\"photons\",\"electron carrier molecules\",\"photosystem II\",\"photosystem I\",\"RUDP5\",\"PGAL\",\"thylakoids\",\"chlorophyll\",\"stroma\",\"chloroplast\"]','[0]','multiple-choice',1,4,'2025-10-28 00:07:24'),
(17,'Q1 Check Your Knowledge 2','Flat, disc-like sacs where the photosystems are located.','[\"stomata\",\"antenna molecules\",\"glucose\",\"photons\",\"electron carrier molecules\",\"photosystem II\",\"photosystem I\",\"RUDP5\",\"PGAL\",\"thylakoids\",\"chlorophyll\",\"stroma\",\"chloroplast\"]','[9]','multiple-choice',1,5,'2025-10-28 00:07:24'),
(18,'Q1 Check Your Knowledge 2','The part in the chloroplasts where synthesis of glucose takes place.','[\"stomata\",\"antenna molecules\",\"glucose\",\"photons\",\"electron carrier molecules\",\"photosystem II\",\"photosystem I\",\"RUDP5\",\"PGAL\",\"thylakoids\",\"chlorophyll\",\"stroma\",\"chloroplast\"]','[11]','multiple-choice',1,6,'2025-10-28 00:07:24'),
(19,'Q1 Check Your Knowledge 2','The green, light-trapping pigment.','[\"stomata\",\"antenna molecules\",\"glucose\",\"photons\",\"electron carrier molecules\",\"photosystem II\",\"photosystem I\",\"RUDP5\",\"PGAL\",\"thylakoids\",\"chlorophyll\",\"stroma\",\"chloroplast\"]','[10]','multiple-choice',1,7,'2025-10-28 00:07:24'),
(20,'Q1 Check Your Knowledge 2','Can accept and release high-energy electrons.','[\"stomata\",\"antenna molecules\",\"glucose\",\"photons\",\"electron carrier molecules\",\"photosystem II\",\"photosystem I\",\"RUDP5\",\"PGAL\",\"thylakoids\",\"chlorophyll\",\"stroma\",\"chloroplast\"]','[4]','multiple-choice',1,8,'2025-10-28 00:07:24'),
(21,'Q1 Check Your Knowledge 2','Discrete packets of light energy.','[\"stomata\",\"antenna molecules\",\"glucose\",\"photons\",\"electron carrier molecules\",\"photosystem II\",\"photosystem I\",\"RUDP5\",\"PGAL\",\"thylakoids\",\"chlorophyll\",\"stroma\",\"chloroplast\"]','[3]','multiple-choice',1,9,'2025-10-28 00:07:24'),
(22,'Q1 Check Your Knowledge 2','They can absorb and gather light and convey it to the reaction center.','[\"stomata\",\"antenna molecules\",\"glucose\",\"photons\",\"electron carrier molecules\",\"photosystem II\",\"photosystem I\",\"RUDP5\",\"PGAL\",\"thylakoids\",\"chlorophyll\",\"stroma\",\"chloroplast\"]','[1]','multiple-choice',1,10,'2025-10-28 00:07:24'),
(23,'Q1 Check Your Knowledge 3','Substrate-level phosphorylation of ADP from alpha-ketoglutaric acid.','[\"A-glycolysis\", \"B-transition reaction\", \"C-Krebs cycle\", \"D-electron transport chain and chemiosmosis\", \"E-alcoholic fermentation\", \"F-lactic acid fermentation\"]','2','multiple-choice',1,1,'2025-10-28 00:13:43'),
(24,'Q1 Check Your Knowledge 3','Removal of carbon dioxide from pyruvic acid.','[\"A-glycolysis\", \"B-transition reaction\", \"C-Krebs cycle\", \"D-electron transport chain and chemiosmosis\", \"E-alcoholic fermentation\", \"F-lactic acid fermentation\"]','1','multiple-choice',1,2,'2025-10-28 00:13:43'),
(25,'Q1 Check Your Knowledge 3','Production of 32 ATP molecules.','[\"A-glycolysis\", \"B-transition reaction\", \"C-Krebs cycle\", \"D-electron transport chain and chemiosmosis\", \"E-alcoholic fermentation\", \"F-lactic acid fermentation\"]','3','multiple-choice',1,3,'2025-10-28 00:13:43'),
(26,'Q1 Check Your Knowledge 3','Pruvic acid to lactic acid.','[\"A-glycolysis\", \"B-transition reaction\", \"C-Krebs cycle\", \"D-electron transport chain and chemiosmosis\", \"E-alcoholic fermentation\", \"F-lactic acid fermentation\"]','5','multiple-choice',1,4,'2025-10-28 00:13:43'),
(27,'Q1 Check Your Knowledge 3','Reduction of FAD⁺ to FADH.','[\"A-glycolysis\", \"B-transition reaction\", \"C-Krebs cycle\", \"D-electron transport chain and chemiosmosis\", \"E-alcoholic fermentation\", \"F-lactic acid fermentation\"]','2','multiple-choice',1,5,'2025-10-28 00:13:43'),
(28,'Q1 Check Your Knowledge 3','Phosphorylation of fructose 6-phosphate.','[\"A-glycolysis\", \"B-transition reaction\", \"C-Krebs cycle\", \"D-electron transport chain and chemiosmosis\", \"E-alcoholic fermentation\", \"F-lactic acid fermentation\"]','0','multiple-choice',1,6,'2025-10-28 00:13:43'),
(29,'Q1 Check Your Knowledge 3','Oxidation of NADH molecules.','[\"A-glycolysis\", \"B-transition reaction\", \"C-Krebs cycle\", \"D-electron transport chain and chemiosmosis\", \"E-alcoholic fermentation\", \"F-lactic acid fermentation\"]','3','multiple-choice',1,7,'2025-10-28 00:13:43'),
(30,'Q1 Check Your Knowledge 3','Oxidation of NADH from pyruvic acid as a carbon dioxide is released.','[\"A-glycolysis\", \"B-transition reaction\", \"C-Krebs cycle\", \"D-electron transport chain and chemiosmosis\", \"E-alcoholic fermentation\", \"F-lactic acid fermentation\"]','1','multiple-choice',1,8,'2025-10-28 00:13:43'),
(31,'Q1 Check Your Knowledge 3','Formulation of H⁺ gradient.','[\"A-glycolysis\", \"B-transition reaction\", \"C-Krebs cycle\", \"D-electron transport chain and chemiosmosis\", \"E-alcoholic fermentation\", \"F-lactic acid fermentation\"]','3','multiple-choice',1,9,'2025-10-28 00:13:43'),
(32,'Q1 Check Your Knowledge 3','Dephosphorylation of two molecules of ATP to ADP.','[\"A-glycolysis\", \"B-transition reaction\", \"C-Krebs cycle\", \"D-electron transport chain and chemiosmosis\", \"E-alcoholic fermentation\", \"F-lactic acid fermentation\"]','0','multiple-choice',1,10,'2025-10-28 00:13:43'),
(33,'Q2 Check Your Knowledge 1','It is the shorthand method of representing the composition of a substance by using chemical symbols.',NULL,'\"chemical formula\"','identification',1,1,'2025-10-28 00:13:49'),
(34,'Q2 Check Your Knowledge 1','It indicates the kinds of atoms in the compound formed and the simplest whole number ratio of the atoms in the compound.',NULL,'\"empirical formula\"','identification',1,2,'2025-10-28 00:13:49'),
(35,'Q2 Check Your Knowledge 1','It is represented by letter N, the exact value of Avogadro\'s number.',NULL,'\"6.022 x 10^23\"','identification',1,3,'2025-10-28 00:13:49'),
(36,'Q2 Check Your Knowledge 1','The mass in grams of one mole of substance.',NULL,'\"molar mass\"','identification',1,4,'2025-10-28 00:13:49'),
(37,'Q2 Check Your Knowledge 1','The Father of Modern Chemistry.',NULL,'\"antoine lavoisier\"','identification',1,5,'2025-10-28 00:13:49'),
(38,'Q2 Check Your Knowledge 1','The whole number multiple of empirical formula.',NULL,'\"molecular formula\"','identification',1,6,'2025-10-28 00:13:49'),
(39,'Q2 Check Your Knowledge 1','Unit used to describe molar mass.',NULL,'\"grams per mole\"','identification',1,7,'2025-10-28 00:13:49'),
(40,'Q2 Check Your Knowledge 1','The chemist who investigated the composition of hydrogen and oxygen and gave a percentage composition of 11% and 89% respectively.',NULL,'\"joseph louis proust\"','identification',1,8,'2025-10-28 00:13:49'),
(41,'Q2 Check Your Knowledge 1','Chemical formula for glucose.',NULL,'\"c6h12o6\"','identification',1,9,'2025-10-28 00:13:49'),
(42,'Q2 Check Your Knowledge 1','SI symbol for mole.',NULL,'\"mol\"','identification',1,10,'2025-10-28 00:13:49'),
(43,'Q3 Check Your Knowledge 1','Is an isobaric process?','[\"no heat enters or leaves the system\",\"the volume of the system is constant\",\"the pressure of the system is constant\",\"the temperature of the system is constant\"]','2','multiple-choice',1,1,'2025-10-28 00:26:33'),
(44,'Q3 Check Your Knowledge 1','To maximize the performance of a refrigerator, you have to?','[\"Maximize Tc as warm as possible\",\"Make ΔT as large as possible\",\"Make ΔT as small as possible\",\"Make TH as cool as possible\"]','2','multiple-choice',1,2,'2025-10-28 00:26:33'),
(45,'Q3 Check Your Knowledge 2','Identify: A. a balloon being expanded very rapidly',NULL,'\"adiabatic\"','identification',1,1,'2025-10-28 00:26:42'),
(46,'Q3 Check Your Knowledge 2','Identify: B. a balloon being expanded very slowly by the addition of heat',NULL,'\"isothermal\"','identification',1,2,'2025-10-28 00:26:42'),
(47,'Q3 Check Your Knowledge 2','Identify: C. a balloon being heated inside a solid metal case',NULL,'\"isovolumetric\"','identification',1,3,'2025-10-28 00:26:42'),
(48,'Q3 Check Your Knowledge 3','Will entropy change positively or negatively? Moisture condenses on the outside of a cold glass','[\"Positive\",\"Negative\"]','[1]','multiple-choice',1,1,'2025-10-28 00:26:52'),
(49,'Q3 Check Your Knowledge 3','Will entropy change positively or negatively? Raindrops form in a cloud','[\"Positive\",\"Negative\"]','[1]','multiple-choice',1,2,'2025-10-28 00:26:52'),
(50,'Q3 Check Your Knowledge 3','Will entropy change positively or negatively? Gasoline vaporizes in the carburator of an automobile engine','[\"Positive\",\"Negative\"]','[0]','multiple-choice',1,3,'2025-10-28 00:26:52'),
(51,'Q3 Check Your Knowledge 3','Will entropy change positively or negatively? Air is pumped into a tire','[\"Positive\",\"Negative\"]','[1]','multiple-choice',1,4,'2025-10-28 00:26:52'),
(52,'Q3 Check Your Knowledge 3','Will entropy change positively or negatively? Frost forms on a windshield of your car','[\"Positive\",\"Negative\"]','[1]','multiple-choice',1,5,'2025-10-28 00:26:52'),
(53,'Q3 Check Your Knowledge 3','Will entropy change positively or negatively? Sugar dissolves in coffee','[\"Positive\",\"Negative\"]','[0]','multiple-choice',1,6,'2025-10-28 00:26:52'),
(54,'Q3 Check Your Understanding 1','Explain why placing the air conditioning system in the middle of the room will not help in cooling the room.',NULL,NULL,'open-ended',1,1,'2025-10-28 00:27:02'),
(55,'Q3 Check Your Understanding 1','A refrigerator is running in a small room. The refrigerator door is open, but the room does not grow any cooler. Use the law of conservation of energy to explain why the temperature does not drop.',NULL,NULL,'open-ended',1,2,'2025-10-28 00:27:02'),
(56,'Q3 Check Your Understanding 1','A standard deck of cards has all the suits in order. The card is shuffled many times. Do you think it is possible to return the cards to their order? Explain.',NULL,NULL,'open-ended',1,3,'2025-10-28 00:27:02'),
(57,'Q3 Check Your Understanding 1','Investigate experiments by Benjamin Thompson (Count Rumford) and James Prescott Joule and evaluate whether the unit of energy should be attributed to Joule and not Thompson.',NULL,NULL,'open-ended',1,4,'2025-10-28 00:27:02'),
(58,'Q4 Check Your Knowledge 1','Identify the correct form of energy seen in a reservoir.',NULL,'\"potential energy\"','identification',1,1,'2025-10-28 00:35:14'),
(59,'Q4 Check Your Knowledge 1','Identify the correct form of energy seen in a turbine.',NULL,'\"mechanical energy\"','identification',1,2,'2025-10-28 00:35:14'),
(60,'Q4 Check Your Knowledge 1','Identify the correct form of energy seen in power lines.',NULL,'\"electrical energy\"','identification',1,3,'2025-10-28 00:35:14'),
(61,'Q4 Check Your Knowledge 2','True or False: The production of an electric current by changing magnetic field is known as induction.','[\"True\",\"False\"]','[0]','multiple-choice',1,1,'2025-10-28 00:35:47'),
(62,'Q4 Check Your Knowledge 2','True or False: The rate at which energy is converted from one form to another is called kilowatt-hours.','[\"True\",\"False\"]','[1]','multiple-choice',1,2,'2025-10-28 00:35:47'),
(63,'Q4 Check Your Knowledge 2','True or False: Power is equal to the product of energy and current.','[\"True\",\"False\"]','[1]','multiple-choice',1,3,'2025-10-28 00:35:47'),
(64,'Q4 Check Your Knowledge 2','True or False: The Turbin\'s purpose in generating electricity is to turn the armature of a generator to produce current.','[\"True\",\"False\"]','[0]','multiple-choice',1,4,'2025-10-28 00:35:47'),
(65,'Q4 Check Your Knowledge 2','True or False: If an appliance is given a high power rating, it means slower rate of energy conversion.','[\"True\",\"False\"]','[1]','multiple-choice',1,5,'2025-10-28 00:35:47'),
(66,'Q4 Process What You Know 1','Which device uses energy at the rate as ten 100-watt light bulbs?','[\"food processor\",\"coffee maker\",\"washing machine\",\"stove\"]','2','multiple-choice',1,1,'2025-10-28 00:35:59'),
(67,'Q4 Process What You Know 1','If a standard household voltage is 220 volts, what is the current through a stove that uses 6000 watts of power?','[\"20A\",\"27A\",\"50A\",\"75A\"]','1','multiple-choice',1,2,'2025-10-28 00:35:59'),
(68,'Q4 Process What You Know 1','An electric company charges 5.55 pesos per kilowatt-hour of energy. How much does it cost to run a clothes dryer for two hours if it uses 5400 watts?','[\"30 pesos\",\"40 pesos\",\"50 pesos\",\"60 pesos\"]','2','multiple-choice',1,3,'2025-10-28 00:35:59'),
(69,'Q4 Process What You Know 1','If a food processor = 500W, hair dryer = 1200W, clothes dryer = 5400W, and stove = 6000W, which would use the greatest amount of energy?','[\"food processor\",\"hair dryer\",\"clothes dryer\",\"stove\"]','3','multiple-choice',1,4,'2025-10-28 00:35:59'),
(70,'Q4 Process What You Know 2','Describe what a service panel in your house is and what function it serves.',NULL,NULL,'open-ended',5,1,'2025-10-28 00:36:06');
/*!40000 ALTER TABLE `quizzes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `UserID` int(11) NOT NULL AUTO_INCREMENT,
  `Email` varchar(100) DEFAULT NULL,
  `UserName` varchar(100) DEFAULT NULL,
  `Password` varchar(100) DEFAULT NULL,
  `FirstName` varchar(50) DEFAULT NULL,
  `MiddleName` varchar(50) DEFAULT NULL,
  `LastName` varchar(50) DEFAULT NULL,
  `Role` enum('student','teacher') NOT NULL DEFAULT 'student',
  PRIMARY KEY (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(19,'lim@example.com','Teacher/Admin','$2b$10$cTDBc//e9CYzHO4YGD1.LO8nu8fPFtQ/k.IHhvwtkIrDWOBtmT53.','Hanzy','zaragoza','lim','teacher'),
(32,'hanzdavid2002@gmail.com','Teacher1','$2b$10$MrTpTaHhg5dqqZ5UN4Qd9OGmuU8YGlLp/YH8b8OArbusvAg1GegOC','Hanz','David','Lim','teacher'),
(49,'hanzdavid2003@gmail.com','hanz1','$2b$10$eUL0wCdjXVdeF4j0yExPxOwdUZm9HufPaivI0W2fJtVCExQOer9Nm','hanz','','lim','student'),
(50,'hanzdavid2004@gmail.com','hanz','$2b$10$kMXQ/Jb6f1OR3JvrNL5AfOO0Ll2qyaJHjuDeTQ4ahNoaF3N05lgHS','hanz','','david','student');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'quizapp_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- Dump completed on 2026-03-27 13:07:53
