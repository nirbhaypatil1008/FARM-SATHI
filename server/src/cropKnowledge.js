/**
 * Agronomic reference database for crop and plant diseases.
 * Grounded in ICAR (Indian Council of Agricultural Research), TNAU Agritech Portal,
 * and PlantVillage extension guidelines.
 * All recommendations avoid specific synthetic pesticide brand prescriptions,
 * focusing on field hygiene, cultural management, and safe bio-rational / organic practices.
 */

const KNOWLEDGE_CATALOG = {
  // --- TOMATO ---
  'Tomato___Early_blight': {
    plantName: 'Tomato',
    diseaseName: 'Early blight',
    severity: 'moderate',
    symptoms: [
      'Dark brown to black circular lesions with characteristic concentric "target-board" rings',
      'Yellow chlorotic halos surrounding lesions on older bottom leaves',
      'Premature defoliation advancing from lower to upper canopy',
    ],
    possibleCauses: [
      'Fungal infection caused by Alternaria solani',
      'Soil-borne fungal spores splashed onto lower leaves during rainfall or overhead watering',
    ],
    conduciveConditions: [
      'Warm temperatures (24°C to 29°C) combined with high humidity (>80%)',
      'Extended periods of leaf wetness exceeding 8 hours',
    ],
    immediateActions: [
      'Prune and safely burn or deep-bury severely infected bottom leaves',
      'Do not compost infected tomato debris in farm compost pits',
      'Switch immediately to drip or furrow irrigation to keep leaves dry',
    ],
    farmingPractices: [
      'Maintain 60 cm × 45 cm plant spacing for optimal canopy ventilation',
      'Stake or trellis tomato plants to elevate foliage above soil level',
      'Practice 3-year crop rotation avoiding other Solanaceae (potato, brinjal, chilli)',
    ],
    organicOptions: [
      'Spray Neem seed kernel extract (NSKE 5%) or cold-pressed Neem oil (3–5 ml/L with soap)',
      'Apply Trichoderma viride or Pseudomonas fluorescens (10 g/L) to foliage and root zone',
      'Bordeaux mixture (1%) as a protective preventative spray during cloudy, humid spells',
    ],
    prevention: [
      'Use certified disease-free seeds and disease-tolerant hybrids',
      'Apply 2–3 inches of dry straw or sugarcane bagasse mulch to prevent soil splashing',
    ],
    professionalHelp: [
      'If defoliation exceeds 25% of canopy, consult your local Krishi Vigyan Kendra (KVK).',
    ],
  },

  'Tomato___Late_blight': {
    plantName: 'Tomato',
    diseaseName: 'Late blight',
    severity: 'high',
    symptoms: [
      'Irregular water-soaked pale green lesions that rapidly expand into dark brown/purplish patches',
      'Delicate white fungal-like sporulation visible on leaf undersides in morning humidity',
      'Entire stems turn brittle and black; fruit develops greasy brown sunken blotches',
    ],
    possibleCauses: [
      'Oomycete pathogen Phytophthora infestans',
      'Wind-borne sporangia travelling over long distances in cool, damp weather',
    ],
    conduciveConditions: [
      'Cool to moderate temperatures (12°C to 22°C) with persistent fog, mist, or continuous rains',
      'Relative humidity consistently above 90%',
    ],
    immediateActions: [
      'Immediately remove and destroy all blighted leaves, stems, and affected fruit',
      'Cease all overhead watering and avoid handling plants when leaves are wet',
      'Inspect adjacent potato and tomato plots immediately',
    ],
    farmingPractices: [
      'Ensure well-drained raised beds to avoid stagnant moisture around root crown',
      'Wider row spacing and prompt trellising to accelerate morning leaf drying',
    ],
    organicOptions: [
      'Preventative spray of copper hydroxide or Bordeaux mixture (1%) prior to monsoon onset',
      'Foliar spray of Trichoderma harzianum bio-agent early in crop growth',
    ],
    prevention: [
      'Plant certified blight-resistant tomato varieties',
      'Never plant tomatoes adjacent to late-season potato fields',
    ],
    professionalHelp: [
      'Late blight can destroy an entire field within 5–7 days. Alert local agricultural extension officer immediately upon confirmation.',
    ],
  },

  'Tomato___Bacterial_spot': {
    plantName: 'Tomato',
    diseaseName: 'Bacterial spot',
    severity: 'moderate',
    symptoms: [
      'Small (2–3 mm), dark brown to black angular water-soaked lesions on foliage',
      'Distinct yellow halos around leaf lesions; leaves turn yellow and drop prematurely',
      'Small raised scabby black specks on green fruit surfaces',
    ],
    possibleCauses: [
      'Bacterial pathogen Xanthomonas perforans / Xanthomonas vesicatoria',
      'Infected seed lots, wind-driven rain, and contaminated agricultural tools',
    ],
    conduciveConditions: [
      'Warm temperatures (25°C to 30°C) with frequent rain showers and wind',
    ],
    immediateActions: [
      'Sanitize pruning tools with 70% alcohol or bleach solution between rows',
      'Remove and safely dispose of heavily infected leaves',
    ],
    farmingPractices: [
      'Avoid working in the field when plants are wet with dew or irrigation water',
      'Mulch beds with organic straw to suppress bacterial splash from soil',
    ],
    organicOptions: [
      'Spray copper-based organic formulations (copper oxychloride 2.5 g/L) as a protectant',
      'Foliar application of Pseudomonas fluorescens (5–10 g/L)',
    ],
    prevention: [
      'Soak seeds in hot water (50°C for 25 minutes) or use certified pathogen-free seed',
      'Rotate crops for at least 2 seasons away from pepper and tomato',
    ],
    professionalHelp: [
      'Consult local horticulture department for seed testing and certified bacterial-resistant varieties.',
    ],
  },

  'Tomato___Septoria_leaf_spot': {
    plantName: 'Tomato',
    diseaseName: 'Septoria leaf spot',
    severity: 'moderate',
    symptoms: [
      'Numerous small (2–4 mm) circular spots with dark brown margins and sunken grayish-white centers',
      'Tiny black pycnidia (fruiting bodies) visible inside mature spot centers under a lens',
      'Leaves turn yellow, wither, and drop, exposing developing fruit to sunscald',
    ],
    possibleCauses: [
      'Fungus Septoria lycopersici overwintering in Solanaceous weed hosts and crop residue',
    ],
    conduciveConditions: [
      'Temperatures between 20°C and 26°C with prolonged rain, overhead irrigation, or high humidity',
    ],
    immediateActions: [
      'Strip infected lower leaves and safely dispose of them away from the field',
      'Adjust irrigation to ground-level drip tubes',
    ],
    farmingPractices: [
      'Provide sturdy stakes to lift foliage off soil',
      'Clear horse nettle and wild nightshade weeds around field perimeters',
    ],
    organicOptions: [
      'Preventative applications of copper oxychloride (2.5 g/L) or Bordeaux mixture',
      'Bio-control spray with Bacillus subtilis or Trichoderma viride',
    ],
    prevention: [
      'Deep plough field residues at the end of each harvest',
      'Rotate with non-Solanaceous crops (maize, pulses, mustard) for 2 years',
    ],
    professionalHelp: [
      'Contact local KVK if lower leaf defoliation threatens canopy coverage.',
    ],
  },

  'Tomato___Leaf_Mold': {
    plantName: 'Tomato',
    diseaseName: 'Leaf mold',
    severity: 'moderate',
    symptoms: [
      'Pale green to yellowish diffuse patches on the upper surface of older leaves',
      'Dense, olive-green to grayish-brown velvety fungal growth on the corresponding lower surface',
      'Infected leaves curl, wither, and drop prematurely',
    ],
    possibleCauses: [
      'Fungus Passalora fulva (syn. Cladosporium fulvum)',
      'High greenhouse or polyhouse humidity and stagnant airflow',
    ],
    conduciveConditions: [
      'Relative humidity exceeding 85% with warm temperatures (21°C to 24°C)',
    ],
    immediateActions: [
      'Increase greenhouse or polyhouse ventilation immediately',
      'Prune lower suckers and dense leaves to improve lateral breeze',
    ],
    farmingPractices: [
      'Space plants generously and avoid tight row clustering',
      'Water only in early morning so foliage dries before nightfall',
    ],
    organicOptions: [
      'Spray potassium bicarbonate solution (3–5 g/L) or bio-fungicide Bacillus subtilis',
      'Neem oil foliar spray (3 ml/L)',
    ],
    prevention: [
      'Choose leaf-mold resistant tomato hybrids (look for Cf resistance genes)',
      'Maintain greenhouse relative humidity below 80% with exhaust fans',
    ],
    professionalHelp: [
      'Consult greenhouse agronomists for microclimate regulation techniques.',
    ],
  },

  'Tomato___Spider_mites Two-spotted_spider_mite': {
    plantName: 'Tomato',
    diseaseName: 'Spider mites (Two-spotted spider mite)',
    severity: 'moderate',
    symptoms: [
      'Fine white, yellow, or silvery speckling (stippling) on upper leaf surface',
      'Delicate, silky webbing spun across leaf undersides and growing tips',
      'Leaves turn bronze, dry out, become brittle, and drop; plants become stunted',
    ],
    possibleCauses: [
      'Tetranychus urticae mites piercing plant cells to feed on sap',
      'Hot, dry, dusty environmental conditions suppressing natural predatory insects',
    ],
    conduciveConditions: [
      'Hot weather (>30°C) with dry atmospheric conditions (<50% RH)',
    ],
    immediateActions: [
      'Spray affected plants with a strong jet of clean water to knock off mites and destroy webs',
      'Prune and burn heavily infested leaves with heavy webbing',
    ],
    farmingPractices: [
      'Maintain field perimeter moisture and suppress roadside dust',
      'Avoid excessive synthetic nitrogen fertilizer which stimulates mite reproduction',
    ],
    organicOptions: [
      'Spray Neem oil (5 ml/L) or Pongamia (Karanja) oil with soap emulsifier',
      'Release predatory mites (Phytoseiulus persimilis or Neoseiulus californicus)',
      'Wettable sulfur spray (2 g/L) if temperature is below 32°C (avoid sulfur in scorching heat)',
    ],
    prevention: [
      'Intercrop with flowering coriander or marigold to attract beneficial predatory insects',
      'Consistently monitor leaf undersides with a 10x hand lens during dry spells',
    ],
    professionalHelp: [
      'Contact local entomologist or agricultural officer if webbing spans multiple plants.',
    ],
  },

  'Tomato___Target_Spot': {
    plantName: 'Tomato',
    diseaseName: 'Target spot',
    severity: 'moderate',
    symptoms: [
      'Small circular brown lesions that enlarge with pinpoint white centers and concentric rings',
      'Target-like lesions also occur on stems, petioles, and green fruit',
      'Severe spotting causes substantial leaf yellowing and leaf loss',
    ],
    possibleCauses: [
      'Fungus Corynespora cassiicola infecting leaves and stems',
    ],
    conduciveConditions: [
      'Warm, humid tropical weather with intermittent rains (25°C to 32°C)',
    ],
    immediateActions: [
      'Remove lower diseased foliage and dispose outside the cultivation area',
      'Eliminate nearby weed hosts (wild cucumber, Solanum nigrum)',
    ],
    farmingPractices: [
      'Improve row spacing to reduce humidity inside canopy',
      'Avoid overhead sprinkling',
    ],
    organicOptions: [
      'Foliar spray of copper oxychloride (2.5 g/L)',
      'Bio-control using Trichoderma viride foliar treatment',
    ],
    prevention: [
      'Crop rotation for at least two years with grasses or cereals',
      'Thorough field sanitation post harvest',
    ],
    professionalHelp: [
      'Consult local agriculture extension center for region-adapted fungicides.',
    ],
  },

  'Tomato___Tomato_mosaic_virus': {
    plantName: 'Tomato',
    diseaseName: 'Tomato mosaic virus (ToMV)',
    severity: 'high',
    symptoms: [
      'Mottled light green and dark green mosaic patterns on foliage',
      'Leaf distortion, blistering, narrow "shoestring" leaf blades',
      'Stunted plant growth and uneven internal browning of fruit',
    ],
    possibleCauses: [
      'Tomato mosaic virus transmitted mechanically by hands, tools, and tobacco residue',
    ],
    conduciveConditions: [
      'Readily transmitted at all temperatures through physical contact with infected sap',
    ],
    immediateActions: [
      'Uproot and burn infected plants immediately; do not leave them in the field',
      'Wash hands thoroughly with soap or milk solution before handling other plants',
      'Disinfect all pruning knives, stakes, and twine with 10% trisodium phosphate or bleach',
    ],
    farmingPractices: [
      'Prohibit smoking or tobacco handling anywhere near tomato or pepper crops',
      'Clean greenhouse structures and tools thoroughly between seasons',
    ],
    organicOptions: [
      'No cure exists for viral plant infections; focus entirely on sanitation and vector control',
      'Spray skim milk solution (10% in water) on seedlings before transplanting to reduce mechanical transmission',
    ],
    prevention: [
      'Use certified virus-free seeds and virus-resistant varieties (look for ToMV/TMV resistance)',
      'Control chewing insects and weed hosts',
    ],
    professionalHelp: [
      'Report suspected viral outbreaks to state horticulture officers for confirmation.',
    ],
  },

  'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {
    plantName: 'Tomato',
    diseaseName: 'Tomato Yellow Leaf Curl Virus (TYLCV)',
    severity: 'high',
    symptoms: [
      'Upward curling, cupping, and puckering of leaf margins',
      'Prominent chlorosis (yellowing) between leaf veins, particularly on new growth',
      'Severe plant stunting, shortened internodes, and bushy compact appearance',
      'Drastic reduction in flower set; flowers drop before setting fruit',
    ],
    possibleCauses: [
      'Begomovirus transmitted persistently by the Silverleaf Whitefly (Bemisia tabaci)',
    ],
    conduciveConditions: [
      'Warm, dry tropical seasons that promote massive whitefly population explosions',
    ],
    immediateActions: [
      'Rogue out and destroy symptomatic plants in the first 4–6 weeks of planting',
      'Install yellow sticky traps (15–20 traps per acre) to monitor and trap whiteflies',
    ],
    farmingPractices: [
      'Cover nursery seedling beds with 40–50 mesh insect-proof netting',
      'Grow 2–3 border rows of tall maize, sorghum, or pearl millet as physical barrier crops',
    ],
    organicOptions: [
      'Spray Neem oil (5 ml/L) or NSKE 5% every 7–10 days to repel and suppress whitefly nymphs',
      'Spray Verticillium lecanii or Beauveria bassiana (5 g/L) entomopathogenic fungi',
    ],
    prevention: [
      'Plant TYLCV-resistant tomato hybrids (e.g., US-618, Abhinav, Saaho)',
      'Synchronize planting dates within the farming community to break whitefly cycles',
    ],
    professionalHelp: [
      'Contact local Krishi Vigyan Kendra for area-wide whitefly management strategies.',
    ],
  },

  'Tomato___healthy': {
    plantName: 'Tomato',
    diseaseName: 'Healthy tomato leaf',
    severity: 'low',
    symptoms: [
      'Vibrant uniform green coloration across leaflets',
      'Intact leaf margins and distinct serrations with no lesions, curling, or spots',
      'Stems and petioles are firm, upright, and free from discoloration',
    ],
    possibleCauses: [
      'Plant shows vigorous healthy vegetative growth with no obvious pathogen symptoms',
    ],
    conduciveConditions: [
      'Balanced soil fertility, appropriate moisture, and good air circulation',
    ],
    immediateActions: [
      'Maintain regular balanced watering and nutrient management',
      'Continue routine weekly scouting of leaf undersides',
    ],
    farmingPractices: [
      'Keep soil evenly moist using drip irrigation',
      'Maintain proper staking and prune suckers to preserve canopy airflow',
    ],
    organicOptions: [
      'Apply preventative bio-fertilizer (Azotobacter, Phosphobacteria) and compost tea',
    ],
    prevention: [
      'Continue standard preventive scouting and sanitation practices',
    ],
    professionalHelp: [
      'No immediate intervention required. Keep recording observations.',
    ],
  },

  // --- POTATO ---
  'Potato___Early_blight': {
    plantName: 'Potato',
    diseaseName: 'Early blight',
    severity: 'moderate',
    symptoms: [
      'Dark brown to black angular-to-circular spots with concentric target-like rings on older leaves',
      'Leaf tissue surrounding lesions becomes chlorotic and turns yellow',
      'Lesions may merge, causing leaves to curl and dry up, reducing tuber bulking',
    ],
    possibleCauses: [
      'Fungus Alternaria solani surviving in crop residue or infected seed tubers',
    ],
    conduciveConditions: [
      'Alternating wet and dry weather with temperatures between 24°C and 30°C',
    ],
    immediateActions: [
      'Remove infected foliage before ridging or earthing up',
      'Do not allow sprinkler water to keep potato leaves wet overnight',
    ],
    farmingPractices: [
      'Ensure balanced nitrogen fertilization; nitrogen-deficient plants are far more susceptible',
      'Practice 3-year crop rotation with non-host crops like maize, wheat, or pulses',
    ],
    organicOptions: [
      'Foliar spray of Trichoderma viride (10 g/L) or Pseudomonas fluorescens',
      'Copper oxychloride (2.5 g/L) spray as a protective measure',
    ],
    prevention: [
      'Plant certified disease-free seed tubers from trusted government agencies',
      'Destroy all cull potato piles and volunteer potatoes near fields',
    ],
    professionalHelp: [
      'Consult local agriculture officer if blight spreads above the mid-canopy.',
    ],
  },

  'Potato___Late_blight': {
    plantName: 'Potato',
    diseaseName: 'Late blight',
    severity: 'high',
    symptoms: [
      'Water-soaked dark lesions appearing on leaf tips and margins, rapidly expanding into large brown blighted patches',
      'White cottony fungal growth visible on the underside of infected leaves during humid mornings',
      'Stems develop purplish-brown lesions; tubers turn brown with dry corky granular rot below skin',
    ],
    possibleCauses: [
      'Phytophthora infestans oomycete pathogen',
    ],
    conduciveConditions: [
      'High relative humidity (>90%) with cool overcast weather (10°C to 20°C)',
    ],
    immediateActions: [
      'Immediately destroy blighted foliage to prevent spores washing into soil onto tubers',
      'Stop all furrow or sprinkler irrigation',
    ],
    farmingPractices: [
      'Earth up soil well around potato rows (15–20 cm) to form a barrier preventing spores reaching tubers',
      'Kill or cut potato vines (dehaulming) 10–14 days before harvest to prevent tuber contamination',
    ],
    organicOptions: [
      'Preventive spray of Bordeaux mixture (1%) or copper hydroxide prior to cloud cover periods',
    ],
    prevention: [
      'Plant late blight-resistant potato varieties (e.g., Kufri Girdhari, Kufri Himalini, Kufri Jyoti)',
      'Never plant uncertified market potatoes as seed tubers',
    ],
    professionalHelp: [
      'Late blight requires emergency containment. Contact the district horticulture officer immediately.',
    ],
  },

  'Potato___healthy': {
    plantName: 'Potato',
    diseaseName: 'Healthy potato leaf',
    severity: 'low',
    symptoms: [
      'Uniform lush green foliage across compound leaves',
      'Firm stems and clean leaflet margins with no necrotic spotting or blight margins',
    ],
    possibleCauses: [
      'Healthy plant with normal photosynthetic activity and tuber bulking',
    ],
    conduciveConditions: [
      'Well-drained loose soil, steady cool weather, and balanced nutrition',
    ],
    immediateActions: [
      'Continue earthing up and monitor soil moisture',
    ],
    farmingPractices: [
      'Ensure soil remains well-aerated around tuber zone',
    ],
    organicOptions: [
      'Apply well-decomposed FYM or vermicompost during vegetative stage',
    ],
    prevention: [
      'Regular scouting of lower leaves for early fungal signs',
    ],
    professionalHelp: [
      'Healthy crop. No action needed.',
    ],
  },

  // --- CORN / MAIZE ---
  'Corn___Common_rust': {
    plantName: 'Corn (Maize)',
    diseaseName: 'Common rust',
    severity: 'moderate',
    symptoms: [
      'Small, circular to elongated cinnamon-brown or reddish-brown powdery pustules (uredinia)',
      'Pustules erupt on both upper and lower leaf surfaces, releasing rusty powdery spores on fingers',
      'Severe infections turn leaves yellow, dry, and necrotic, reducing grain fill',
    ],
    possibleCauses: [
      'Fungus Puccinia sorghi wind-borne from Southern and warmer regions',
    ],
    conduciveConditions: [
      'Cool to moderate temperatures (16°C to 25°C) combined with high relative humidity (>95%) and heavy dews',
    ],
    immediateActions: [
      'Inspect severity: if confined to lower canopy after pollination, impact on yield is minimal',
      'Do not apply overhead sprinkler irrigation in late afternoon',
    ],
    farmingPractices: [
      'Plant corn early in the season to mature past peak rust-spore flight periods',
      'Maintain balanced nitrogen: excessive nitrogen promotes lush, highly susceptible foliage',
    ],
    organicOptions: [
      'Foliar spray of wettable sulfur (2–3 g/L) or neem-based formulations',
      'Bio-control spray with Pseudomonas fluorescens (10 g/L)',
    ],
    prevention: [
      'Choose corn hybrids with proven high genetic resistance to Puccinia sorghi (Rp genes)',
      'Rotate crops with legumes (soybean, pigeon pea) to disrupt local pathogen accumulation',
    ],
    professionalHelp: [
      'Consult local agriculture extension officer if pustules cover upper ear leaves before silking.',
    ],
  },

  'Corn___Northern_Leaf_Blight': {
    plantName: 'Corn (Maize)',
    diseaseName: 'Northern Corn Leaf Blight',
    severity: 'moderate',
    symptoms: [
      'Long, elliptical, cigar-shaped grayish-green to tan lesions (2.5 to 15 cm long)',
      'Lesions develop on lower leaves first and advance upward toward the ear leaves',
      'In damp weather, dark olive-gray fungal sporulation develops on lesion surfaces',
    ],
    possibleCauses: [
      'Fungus Exserohilum turcicum surviving on corn crop residue',
    ],
    conduciveConditions: [
      'Moderate temperatures (18°C to 27°C) with prolonged leaf wetness (6–18 hours)',
    ],
    immediateActions: [
      'Monitor whether lesions have reached the ear leaf (critical for yield protection)',
      'Deep plough field post harvest to bury infected stover',
    ],
    farmingPractices: [
      'Rotate corn with non-grass crops (groundnut, soybean, cotton) for 1–2 seasons',
      'Improve field drainage to minimize morning fog and stagnant moisture pockets',
    ],
    organicOptions: [
      'Foliar application of Trichoderma harzianum or Bacillus subtilis bio-agents',
      'Copper oxychloride (2.5 g/L) spray in early crop stages',
    ],
    prevention: [
      'Sow resistant maize hybrids with Ht gene resistance',
      'Avoid high plant density that traps humidity within the canopy',
    ],
    professionalHelp: [
      'Consult your KVK maize specialist if lesions appear on or above ear leaf before tasseling.',
    ],
  },

  'Corn___Cercospora_leaf_spot Gray_leaf_spot': {
    plantName: 'Corn (Maize)',
    diseaseName: 'Gray leaf spot',
    severity: 'moderate',
    symptoms: [
      'Distinct rectangular lesions with sharp, parallel edges restricted between leaf veins',
      'Lesions begin as small tan spots with yellow halos, then elongate into gray/brown rectangles (1–6 cm long)',
      'Canopy blighting reduces photosynthates, causing stalk lodging and poor cob fill',
    ],
    possibleCauses: [
      'Fungus Cercospora zeae-maydis surviving in surface corn stubble',
    ],
    conduciveConditions: [
      'Warm temperatures (24°C to 30°C) with persistent high humidity (>90%) and cloudy skies',
    ],
    immediateActions: [
      'Assess stalk strength: pinch lower stalks to check for internal stalk rot and lodging risk',
      'Plan timely harvest to prevent field lodging if stalks are weakened',
    ],
    farmingPractices: [
      'Practice conservation tillage that buries corn stover before planting next season',
      'Rotate with broadleaf crops (soybean, pigeon pea, vegetables)',
    ],
    organicOptions: [
      'Bio-control foliar spray with Pseudomonas fluorescens (10 g/L)',
      'Neem seed kernel extract (NSKE 5%)',
    ],
    prevention: [
      'Select maize hybrids with strong Gray Leaf Spot tolerance ratings',
      'Maintain balanced soil potassium which promotes stronger stalk cell walls',
    ],
    professionalHelp: [
      'Contact local agricultural extension officer for regional hybrid disease ratings.',
    ],
  },

  'Corn___healthy': {
    plantName: 'Corn (Maize)',
    diseaseName: 'Healthy corn leaf',
    severity: 'low',
    symptoms: [
      'Vibrant deep green long linear leaves with strong central midribs',
      'Clean leaf margins free from powdery pustules, blighted streaks, or chlorotic mottling',
    ],
    possibleCauses: [
      'Vigorous vegetative growth and healthy photosynthetic assimilation',
    ],
    conduciveConditions: [
      'Adequate soil moisture, warm sunshine, and balanced N-P-K nutrition',
    ],
    immediateActions: [
      'Maintain scheduled irrigation during critical tasseling and silking stages',
    ],
    farmingPractices: [
      'Side-dress nitrogen at knee-high stage (V6) for optimal cob development',
    ],
    organicOptions: [
      'Apply vermicompost or fermented jeevamrit along irrigation channels',
    ],
    prevention: [
      'Continue regular pest scouting for fall armyworm and stem borer',
    ],
    professionalHelp: [
      'Healthy crop. Keep monitoring through tasseling.',
    ],
  },

  // --- BELL PEPPER ---
  'Pepper,_bell___Bacterial_spot': {
    plantName: 'Bell Pepper (Chilli)',
    diseaseName: 'Bacterial spot',
    severity: 'moderate',
    symptoms: [
      'Small, circular to irregular water-soaked spots on leaves that turn dark brown with raised margins',
      'Lesions on leaf undersides appear slightly raised and blister-like',
      'Severe infection causes general yellowing and heavy leaf shedding, exposing fruit to sunscald',
    ],
    possibleCauses: [
      'Xanthomonas euvesicatoria bacteria transmitted via infected seed and rain splash',
    ],
    conduciveConditions: [
      'Warm temperatures (24°C to 30°C) with frequent rainfall and high relative humidity',
    ],
    immediateActions: [
      'Remove and safely dispose of severely infected plants in the seedling stage',
      'Disinfect field equipment and avoid entering fields when foliage is wet',
    ],
    farmingPractices: [
      'Use raised beds with plastic or organic straw mulch to curb soil splash',
      'Avoid overhead irrigation; use drip irrigation beneath mulch',
    ],
    organicOptions: [
      'Spray copper hydroxide or copper oxychloride (2.5 g/L) combined with agricultural wettable sulfur',
      'Seed treatment and foliar spray with Pseudomonas fluorescens (10 g/L)',
    ],
    prevention: [
      'Purchase certified disease-free, tested seed lots',
      'Practice 2-year crop rotation with non-Solanaceous crops (maize, pulses, cucurbits)',
    ],
    professionalHelp: [
      'Contact district horticulture department for bacterial spot-resistant bell pepper hybrids.',
    ],
  },

  'Pepper,_bell___healthy': {
    plantName: 'Bell Pepper (Chilli)',
    diseaseName: 'Healthy bell pepper leaf',
    severity: 'low',
    symptoms: [
      'Smooth, glossy, deep green leaves with crisp entire margins',
      'No water-soaked spots, raised blisters, or chlorotic halos',
    ],
    possibleCauses: [
      'Optimal plant nutrition, vigorous root system, and absence of foliar pathogens',
    ],
    conduciveConditions: [
      'Warm well-drained loamy soil with consistent moderate moisture',
    ],
    immediateActions: [
      'Continue regular monitoring and balanced fertigation',
    ],
    farmingPractices: [
      'Keep soil mulched to preserve moisture and suppress weeds',
    ],
    organicOptions: [
      'Foliar spray of seaweed extract (2 ml/L) for enhanced stress tolerance',
    ],
    prevention: [
      'Scout regularly for thrips, mites, and aphids on tender growing tips',
    ],
    professionalHelp: [
      'Healthy crop. No treatment required.',
    ],
  },

  // --- APPLE ---
  'Apple___Apple_scab': {
    plantName: 'Apple',
    diseaseName: 'Apple scab',
    severity: 'moderate',
    symptoms: [
      'Olive-green to dull velvety brown spots on upper leaf surfaces, becoming dark and corky with age',
      'Leaves become distorted, puckered, and drop prematurely in midsummer',
      'Developing fruit develops scabby, cracked, rough brown lesions',
    ],
    possibleCauses: [
      'Fungus Venturia inaequalis overwintering in fallen dead leaves on the orchard floor',
    ],
    conduciveConditions: [
      'Cool, wet spring weather (15°C to 20°C) with extended leaf wetness (9+ hours)',
    ],
    immediateActions: [
      'Prune dense canopy water sprouts to allow sunlight penetration and rapid drying',
      'Rake up and chop or compost fallen autumn orchard leaves',
    ],
    farmingPractices: [
      'Apply 5% urea spray to fallen autumn leaves to speed up decomposition before winter',
      'Open-center or central-leader pruning to maximize inner-canopy airflow',
    ],
    organicOptions: [
      'Lime sulfur spray or wettable sulfur (3 g/L) applied at green-tip to petal-fall stages',
      'Bordeaux mixture (1%) as a dormant or pre-bloom protective spray',
    ],
    prevention: [
      'Plant scab-resistant apple cultivars (e.g., Liberty, Prima, Enterprise, GoldRush)',
      'Maintain an open orchard floor with low cover crops',
    ],
    professionalHelp: [
      'Consult regional horticulture university or fruit extension specialist for scab infection-period forecasting.',
    ],
  },

  'Apple___Black_rot': {
    plantName: 'Apple',
    diseaseName: 'Black rot (Frog-eye leaf spot)',
    severity: 'moderate',
    symptoms: [
      'Small purple spots on leaves that expand into round lesions with tan centers and dark margins ("frog-eye" spots)',
      'Rotting fruit turns dark brown, soft, and later hardens into black mummified fruit hanging on branches',
      'Sunken reddish-brown cankers develop on limbs and bark',
    ],
    possibleCauses: [
      'Fungus Botryosphaeria obtusa colonizing fire-blight cankers, dead wood, and mummified fruit',
    ],
    conduciveConditions: [
      'Warm temperatures (24°C to 27°C) with frequent rain events',
    ],
    immediateActions: [
      'Prune out dead branches, cankers, and fire-blight damaged wood 15 cm below visible infection',
      'Remove all hanging mummified fruit and fallen fruit mummies from the orchard',
    ],
    farmingPractices: [
      'Disinfect pruning tools between cuts with 70% alcohol',
      'Paint large pruning wounds with protective organic tree seal',
    ],
    organicOptions: [
      'Copper-based sprays or Bordeaux mixture applied at silver-tip through pink-bud stages',
      'Sulfur sprays during early post-bloom period',
    ],
    prevention: [
      'Keep trees vigorous through balanced fertilization and drought avoidance',
      'Prevent mechanical and insect wounding of tree bark and fruit skin',
    ],
    professionalHelp: [
      'Consult orchard pathologist for limb canker assessment.',
    ],
  },

  'Apple___Cedar_apple_rust': {
    plantName: 'Apple',
    diseaseName: 'Cedar apple rust',
    severity: 'moderate',
    symptoms: [
      'Bright yellow-orange or reddish-orange circular spots on the upper leaf surface',
      'Tiny black fungal specks develop in the center of the orange spots',
      'Clusters of small tube-like cups (aecia) protrude from the leaf underside, shedding rusty spores',
    ],
    possibleCauses: [
      'Gymnosporangium juniperi-virginianae rust fungus requiring two alternating hosts: apple and eastern red cedar / juniper',
    ],
    conduciveConditions: [
      'Warm, rainy spring days (12°C to 24°C) causing gelatinous horn galls to expand on nearby cedar trees',
    ],
    immediateActions: [
      'Identify and remove nearby eastern red cedar (Juniperus virginiana) trees within a 1–2 km radius if practical',
      'Prune and destroy cedar galls on ornamental junipers in winter before spring spore release',
    ],
    farmingPractices: [
      'Keep tree canopy open to promote quick drying of morning moisture',
    ],
    organicOptions: [
      'Sulfur sprays applied at 7–10 day intervals from tight cluster stage until petal fall',
      'Bio-fungicide sprays containing Bacillus amyloliquefaciens',
    ],
    prevention: [
      'Plant rust-resistant apple varieties (e.g., Enterprise, Freedom, Liberty, McIntosh)',
      'Avoid planting ornamental junipers adjacent to apple orchards',
    ],
    professionalHelp: [
      'Consult district fruit extension office for rust forecasting.',
    ],
  },

  'Apple___healthy': {
    plantName: 'Apple',
    diseaseName: 'Healthy apple leaf',
    severity: 'low',
    symptoms: [
      'Deep green, leathery leaves with clean serrated margins and no corky spots or rust cups',
    ],
    possibleCauses: [
      'Healthy tree canopy with balanced soil nutrition and proper pruning',
    ],
    conduciveConditions: [
      'Good orchard drainage, open canopy structure, and favorable chill hours',
    ],
    immediateActions: [
      'Continue regular orchard monitoring and balanced irrigation',
    ],
    farmingPractices: [
      'Maintain mulch ring around dripline to conserve root zone moisture',
    ],
    organicOptions: [
      'Apply composted manure and beneficial mycorrhizal root inoculants in dormancy',
    ],
    prevention: [
      'Routine scouting through bloom and fruit set',
    ],
    professionalHelp: [
      'Healthy orchard foliage. No intervention needed.',
    ],
  },

  // --- GRAPE ---
  'Grape___Black_rot': {
    plantName: 'Grape',
    diseaseName: 'Black rot',
    severity: 'high',
    symptoms: [
      'Small, circular reddish-brown spots on leaves surrounded by dark brown borders with black fruiting specks',
      'Berries turn light brown, soften, decay rapidly, and shrivel into hard, black, wrinkled "mummies"',
      'Black elongated lesions on shoots, petioles, and tendrils',
    ],
    possibleCauses: [
      'Fungus Guignardia bidwellii overwintering on mummified berries and canes',
    ],
    conduciveConditions: [
      'Warm temperatures (21°C to 27°C) with persistent leaf wetness for 6–24 hours',
    ],
    immediateActions: [
      'Hand-pick and destroy all mummified grape clusters from vines and ground',
      'Prune and burn infected shoots during dormant winter pruning',
    ],
    farmingPractices: [
      'Trellis vines high and shoot-position to optimize sun exposure and breeze through the fruiting zone',
      'Keep vineyard floor mowed clean to prevent humidity buildup under the canopy',
    ],
    organicOptions: [
      'Copper fungicides or Bordeaux mixture (1%) applied from early shoot development through fruit set',
      'Wettable sulfur sprays applied before berry touch',
    ],
    prevention: [
      'Plant black rot-tolerant grape varieties (e.g., Norton, Ives, Chancellor)',
      'Thorough winter sanitation is the single most effective cultural defense',
    ],
    professionalHelp: [
      'Consult viticulturist if berry rot appears on more than 5% of clusters.',
    ],
  },

  'Grape___Esca_(Black_Measles)': {
    plantName: 'Grape',
    diseaseName: 'Esca (Black Measles)',
    severity: 'high',
    symptoms: [
      'Leaves show distinctive "tiger-stripe" pattern: bright yellow/chlorotic bands between veins that turn reddish-brown and necrotic',
      'Berries develop small, dark purplish or black spots ("measles"), crack, and drop',
      'Sudden vine collapse (apoplexy) where the entire canopy wilts and dies within days in hot weather',
    ],
    possibleCauses: [
      'Complex fungal vascular wilt (Phaeomoniella chlamydospora, Phaeoacremonium minimum, and basidiomycetes)',
      'Pathogens entering through large winter pruning wounds',
    ],
    conduciveConditions: [
      'Hot summer days (>32°C) following heavy spring rain, placing sudden transpiration stress on damaged xylem',
    ],
    immediateActions: [
      'Mark infected vines during summer for delayed winter pruning',
      'Prune infected vines last, and sterilize shears between vines with 70% alcohol',
    ],
    farmingPractices: [
      'Avoid large pruning wounds where possible; prune during dry weather late in winter',
      'Paint all cuts larger than 2 cm with protective pruning paste or Trichoderma wound protectant',
    ],
    organicOptions: [
      'Apply Trichoderma-based bio-fungicide paste directly to fresh pruning wounds',
      'No chemical cure exists for internal wood rot; vine surgery or trunk renewal is required',
    ],
    prevention: [
      'Establish new blocks with certified virus-tested, pathogen-free nursery rootstocks',
      'Renew trunks by retraining healthy suckers from the vine base',
    ],
    professionalHelp: [
      'Consult university viticulture specialist for vine trunk renewal and surgical remediation.',
    ],
  },

  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': {
    plantName: 'Grape',
    diseaseName: 'Leaf blight (Pseudocercospora leaf spot)',
    severity: 'moderate',
    symptoms: [
      'Irregular, dark reddish-brown to black spots (2–8 mm) on mature leaves with defined margins',
      'Lesions may coalesce to form large blighted areas leading to premature leaf defoliation',
      'Under high humidity, grayish velvety fungal growth develops on the underside of spots',
    ],
    possibleCauses: [
      'Fungus Pseudocercospora vitis (syn. Isariopsis clavispora)',
    ],
    conduciveConditions: [
      'Warm, humid late-season weather with heavy dews and frequent showers',
    ],
    immediateActions: [
      'Prune dense interior shoots to improve light interception and airflow',
      'Remove and destroy fallen infected leaves after harvest',
    ],
    farmingPractices: [
      'Maintain canopy opening through selective leaf removal around grape clusters',
    ],
    organicOptions: [
      'Post-harvest preventative spray with Bordeaux mixture (1%) or copper oxychloride (2.5 g/L)',
      'Neem-based organic formulation foliar spray',
    ],
    prevention: [
      'Ensure balanced vine nutrition with adequate potassium',
      'Routine sanitation after vintage to reduce overwintering inocula',
    ],
    professionalHelp: [
      'Consult regional viticultural board for post-harvest spray schedules.',
    ],
  },

  'Grape___healthy': {
    plantName: 'Grape',
    diseaseName: 'Healthy grape leaf',
    severity: 'low',
    symptoms: [
      'Crisp palmate green leaves with clear venation and no necrosis, mildew, or spots',
    ],
    possibleCauses: [
      'Vigorous vine health and active photosynthesis',
    ],
    conduciveConditions: [
      'Balanced canopy management, adequate sunshine, and good vineyard airflow',
    ],
    immediateActions: [
      'Continue standard vineyard canopy maintenance and bunch zone shoot positioning',
    ],
    farmingPractices: [
      'Keep drip irrigation calibrated to vine evapotranspiration needs',
    ],
    organicOptions: [
      'Apply organic compost and foliar seaweed extract for vine vigor',
    ],
    prevention: [
      'Regular scouting for powdery mildew, downy mildew, and black rot',
    ],
    professionalHelp: [
      'Healthy vineyard canopy. No action needed.',
    ],
  },

  // --- SQUASH ---
  'Squash___Powdery_mildew': {
    plantName: 'Squash (Cucurbits)',
    diseaseName: 'Powdery mildew',
    severity: 'moderate',
    symptoms: [
      'Circular powdery white talcum-like fungal spots appearing on both upper and lower leaf surfaces',
      'Spots enlarge and merge to cover entire leaves and stems in a white felt-like film',
      'Infected leaves turn yellow, brown, dry out, and become brittle ("paper-dry"), leading to premature plant death',
    ],
    possibleCauses: [
      'Podosphaera xanthii (syn. Sphaerotheca fuliginea) fungus producing millions of airborne conidia',
    ],
    conduciveConditions: [
      'Warm weather (20°C to 28°C) with shaded conditions and dry foliage; high relative humidity at night followed by dry days',
    ],
    immediateActions: [
      'Prune and safely dispose of the oldest, heavily coated bottom leaves',
      'Ensure squash vines are not overcrowded or shaded by dense weeds',
    ],
    farmingPractices: [
      'Plant in full sun with generous 1.5–2 meter spacing between hills',
      'Trellis vining squash cultivars to elevate foliage off ground level',
    ],
    organicOptions: [
      'Foliar spray of 10% cow milk solution (1 part milk : 9 parts water) under bright sunshine',
      'Baking soda / potassium bicarbonate spray (5 g/L with 2 ml liquid horticultural soap)',
      'Cold-pressed Neem oil spray (5 ml/L) or wettable sulfur (2 g/L)',
    ],
    prevention: [
      'Plant powdery mildew-resistant squash varieties (look for PMR designation)',
      'Rotate crops for at least 2 years away from other cucurbits (cucumber, melon, pumpkin)',
    ],
    professionalHelp: [
      'Consult local agriculture officer for certified bio-fungicide options.',
    ],
  },

  // --- STRAWBERRY ---
  'Strawberry___Leaf_scorch': {
    plantName: 'Strawberry',
    diseaseName: 'Leaf scorch',
    severity: 'moderate',
    symptoms: [
      'Irregular purplish to dark reddish-brown blotches (1–5 mm) with no prominent pale gray centers',
      'As spots multiply, entire leaf turns reddish-brown or purplish, withers, curls up, and appears scorched by fire',
      'Severe infections also affect fruit calyxes (sepals), causing them to turn brown and dry',
    ],
    possibleCauses: [
      'Fungus Diplocarpon earlianum overwintering on live or dead strawberry crowns and foliage',
    ],
    conduciveConditions: [
      'Warm temperatures (20°C to 26°C) with persistent leaf wetness from rain or overhead sprinklers',
    ],
    immediateActions: [
      'Remove and burn infected leaves during spring bed renovation',
      'Switch from overhead sprinkler to drip irrigation beneath plastic mulch',
    ],
    farmingPractices: [
      'Maintain narrow matted rows (30–45 cm) and thin runner plants to maximize breeze',
      'Renovate beds immediately after final fruit harvest by mowing foliage above crowns',
    ],
    organicOptions: [
      'Preventative copper hydroxide or copper oxychloride spray (2 g/L) at early spring leaf emergence',
      'Bio-control foliar spray with Bacillus subtilis',
    ],
    prevention: [
      'Plant certified disease-free strawberry runners of scorch-resistant cultivars (e.g., Allstar, Jewel)',
      'Replant strawberry beds every 3–4 seasons in fresh ground',
    ],
    professionalHelp: [
      'Consult berry extension specialist for strawberry renovation guidelines.',
    ],
  },

  'Strawberry___healthy': {
    plantName: 'Strawberry',
    diseaseName: 'Healthy strawberry leaf',
    severity: 'low',
    symptoms: [
      'Bright green trifoliate leaves with neat serrated teeth and no purplish or necrotic spots',
    ],
    possibleCauses: [
      'Healthy vegetative crown development and active runner formation',
    ],
    conduciveConditions: [
      'Well-drained slightly acidic soil (pH 6.0–6.5) and sunny exposure',
    ],
    immediateActions: [
      'Maintain steady soil moisture using drip lines under mulch',
    ],
    farmingPractices: [
      'Keep strawberry crowns above soil level to avoid crown rot',
    ],
    organicOptions: [
      'Apply pine needle or straw mulch to protect developing berries from soil contact',
    ],
    prevention: [
      'Scout regularly for spider mites and leaf spot',
    ],
    professionalHelp: [
      'Healthy strawberry patch. No action needed.',
    ],
  },

  // --- CITRUS / ORANGE ---
  'Orange___Haunglongbing_(Citrus_greening)': {
    plantName: 'Orange (Citrus)',
    diseaseName: 'Citrus greening (Huanglongbing / HLB)',
    severity: 'high',
    symptoms: [
      'Asymmetric blotchy mottle on leaves: yellow chlorotic patterns that do not match on both sides of the leaf midrib',
      'Yellowing of individual shoots or branches ("yellow dragon") against a green canopy',
      'Hard, misshapen, small, lopsided fruit that stays green at the blossom end with bitter, sour juice',
      'Severe twig dieback and gradual tree decline over 2–5 years',
    ],
    possibleCauses: [
      'Phloem-limited bacterium Candidatus Liberibacter asiaticus transmitted by the Asian Citrus Psyllid (Diaphorina citri)',
    ],
    conduciveConditions: [
      'Warm tropical and subtropical climates that promote rapid citrus psyllid breeding on fresh leaf flushes',
    ],
    immediateActions: [
      'Inspect trees for adult citrus psyllids (tiny brown sap-sucking insects sitting at a 45° angle on tender shoots)',
      'Immediately remove and destroy confirmed HLB-infected trees to protect neighboring citrus groves',
    ],
    farmingPractices: [
      'Control psyllid populations aggressively during every fresh vegetative flush',
      'Install yellow sticky traps in orchards to monitor psyllid arrival',
    ],
    organicOptions: [
      'Spray horticultural mineral oil (1–2%) or Neem oil (5 ml/L) on new shoots to deter psyllid egg-laying',
      'Release the parasitoid wasp Tamarixia radiata as a biological control agent',
    ],
    prevention: [
      'Plant only certified pathogen-free citrus nursery saplings from certified screenhouses',
      'Do not move uncertified citrus plant material or budwood across district boundaries',
    ],
    professionalHelp: [
      'Citrus greening is a regulated high-threat agricultural disease. Notify your district horticulture or ICAR citrus center immediately upon discovery.',
    ],
  },

  // --- PEACH ---
  'Peach___Bacterial_spot': {
    plantName: 'Peach',
    diseaseName: 'Bacterial spot',
    severity: 'moderate',
    symptoms: [
      'Small, angular, water-soaked spots on leaves that turn purplish-brown, dry up, and drop out leaving a "shot-hole" appearance',
      'Severely spotted leaves turn yellow and drop prematurely, weakening the tree',
      'Developing peach fruit shows small sunken dark spots, pitting, and gum exudation with cracking',
    ],
    possibleCauses: [
      'Bacterium Xanthomonas arboricola pv. pruni overwintering in twig cankers and buds',
    ],
    conduciveConditions: [
      'Warm, wet spring weather (20°C to 28°C) with blowing rain, especially on sandy soils',
    ],
    immediateActions: [
      'Avoid high-pressure overhead irrigation that splashes bacteria into tree wounds',
      'Prune out dead shoots and cankered twigs during winter dormancy',
    ],
    farmingPractices: [
      'Plant windbreaks around orchards to reduce wind damage that creates bacterial entry points',
      'Avoid excessive nitrogen fertilization that produces succulent, susceptible shoots',
    ],
    organicOptions: [
      'Dormant spray of copper-based formulations or Bordeaux mixture before bud break',
      'Bio-control foliar spray with Pseudomonas fluorescens or Bacillus subtilis',
    ],
    prevention: [
      'Plant peach cultivars with high bacterial spot tolerance',
      'Maintain balanced tree nutrition with adequate calcium and potassium',
    ],
    professionalHelp: [
      'Consult regional fruit pathologist for dormant spray protocols.',
    ],
  },

  'Peach___healthy': {
    plantName: 'Peach',
    diseaseName: 'Healthy peach leaf',
    severity: 'low',
    symptoms: [
      'Vibrant lanceolate green leaves with smooth finely serrated margins and no shot-holes or gumming',
    ],
    possibleCauses: [
      'Healthy tree canopy with balanced soil nutrition and proper pruning',
    ],
    conduciveConditions: [
      'Well-drained soil, good sun exposure, and proper winter chill hours',
    ],
    immediateActions: [
      'Maintain regular orchard monitoring and balanced irrigation',
    ],
    farmingPractices: [
      'Maintain mulch ring around dripline to conserve root zone moisture',
    ],
    organicOptions: [
      'Apply composted manure and beneficial mycorrhizal root inoculants in dormancy',
    ],
    prevention: [
      'Routine scouting through bloom and fruit set',
    ],
    professionalHelp: [
      'Healthy orchard foliage. No intervention needed.',
    ],
  },

  // --- CHERRY ---
  'Cherry___Powdery_mildew': {
    plantName: 'Cherry',
    diseaseName: 'Powdery mildew',
    severity: 'moderate',
    symptoms: [
      'Patches of white, powdery, talc-like fungal growth on young leaves and succulent green shoots',
      'Infected leaves become curled, puckered, upward-rolled, and stunted',
      'Late-season infections produce tiny dark cleistothecia (fruiting structures) embedded in the white mildew mat',
    ],
    possibleCauses: [
      'Fungus Podosphaera clandestina overwintering in fallen leaves and bud scales',
    ],
    conduciveConditions: [
      'Warm weather (18°C to 25°C) with high humidity, especially in shaded, dense inner canopies',
    ],
    immediateActions: [
      'Prune dense water sprouts and sucker shoots to open inner tree canopy',
      'Do not apply overhead irrigation in evening hours',
    ],
    farmingPractices: [
      'Central leader or open-vase pruning to ensure direct sun reaches interior fruiting spurs',
    ],
    organicOptions: [
      'Foliar spray of wettable sulfur (2–3 g/L) starting at petal-fall stage',
      'Potassium bicarbonate spray (3–5 g/L) or cold-pressed Neem oil (3 ml/L)',
    ],
    prevention: [
      'Select powdery mildew-tolerant cherry cultivars',
      'Scout young shoots weekly during the early growing season',
    ],
    professionalHelp: [
      'Consult stone fruit extension specialist for bloom-stage management.',
    ],
  },

  'Cherry___healthy': {
    plantName: 'Cherry',
    diseaseName: 'Healthy cherry leaf',
    severity: 'low',
    symptoms: [
      'Glossy, deep green leaves with crisp margins and healthy reddish petioles',
    ],
    possibleCauses: [
      'Strong vegetative growth and active photosynthesis',
    ],
    conduciveConditions: [
      'Adequate winter chilling, fertile well-drained loam, and proper canopy pruning',
    ],
    immediateActions: [
      'Maintain balanced drip irrigation',
    ],
    farmingPractices: [
      'Keep orchard floor clear of competing weeds',
    ],
    organicOptions: [
      'Top-dress with well-rotted vermicompost around root drip line',
    ],
    prevention: [
      'Continue standard preventive scouting and sanitation',
    ],
    professionalHelp: [
      'Healthy cherry tree. No action needed.',
    ],
  },

  // --- BLUEBERRY ---
  'Blueberry___healthy': {
    plantName: 'Blueberry',
    diseaseName: 'Healthy blueberry leaf',
    severity: 'low',
    symptoms: [
      'Vibrant oval green leaves with clean margins and no fungal spots or chlorotic mottling',
    ],
    possibleCauses: [
      'Acidic soil conditions (pH 4.5–5.5) supporting optimal iron and nutrient uptake',
    ],
    conduciveConditions: [
      'Acidic organic soil, high pine bark mulch, and steady moisture',
    ],
    immediateActions: [
      'Maintain soil pH in the acidic range (4.5–5.2) using elemental sulfur if tested above 5.5',
    ],
    farmingPractices: [
      'Keep bushes mulched with pine bark or acid peat',
    ],
    organicOptions: [
      'Fertilize with organic cottonseed meal or acidified fish emulsion',
    ],
    prevention: [
      'Monitor soil pH annually with a calibrated soil pH meter',
    ],
    professionalHelp: [
      'Healthy blueberry bushes. No action needed.',
    ],
  },

  // --- RASPBERRY ---
  'Raspberry___healthy': {
    plantName: 'Raspberry',
    diseaseName: 'Healthy raspberry leaf',
    severity: 'low',
    symptoms: [
      'Compound serrated bright green leaves with healthy whitish undersides',
    ],
    possibleCauses: [
      'Vigorous cane development and active root growth',
    ],
    conduciveConditions: [
      'Deep, well-drained loamy soil, cool root zone, and full sun',
    ],
    immediateActions: [
      'Trellis canes to keep foliage off wet soil',
    ],
    farmingPractices: [
      'Prune out spent 2-year-old floricanes after summer fruiting',
    ],
    organicOptions: [
      'Apply organic straw mulch along cane rows',
    ],
    prevention: [
      'Regular scouting for cane blight and spider mites',
    ],
    professionalHelp: [
      'Healthy raspberry patch. No action needed.',
    ],
  },

  // --- SOYBEAN ---
  'Soybean___healthy': {
    plantName: 'Soybean',
    diseaseName: 'Healthy soybean leaf',
    severity: 'low',
    symptoms: [
      'Trifoliate rich green leaves with smooth margins and healthy nitrogen-fixing nodules at roots',
    ],
    possibleCauses: [
      'Active symbiotic nitrogen fixation and vigorous vegetative growth',
    ],
    conduciveConditions: [
      'Warm growing temperatures, adequate rain, and well-aerated loamy soil',
    ],
    immediateActions: [
      'Maintain weeding during first 30–45 days after germination',
    ],
    farmingPractices: [
      'Intercrop with maize or sorghum in 2:1 ratio for yield stability',
    ],
    organicOptions: [
      'Ensure seed was inoculated with Rhizobium japonicum bio-fertilizer at sowing',
    ],
    prevention: [
      'Scout for soybean rust and pod borer at flowering stage',
    ],
    professionalHelp: [
      'Healthy soybean field. No action needed.',
    ],
  },
}

/**
 * Normalizes crop and disease strings to match knowledge entries.
 */
function normalizeKey(plant, disease) {
  const p = (plant || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const d = (disease || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${p}___${d}`
}

/**
 * Retrieve agronomic guidance for a plant and disease.
 */
export function getPlantKnowledge(plantName, diseaseName) {
  if (!plantName && !diseaseName) return null

  // Direct exact key match
  for (const [key, data] of Object.entries(KNOWLEDGE_CATALOG)) {
    const [catPlant, catDisease] = key.split('___')
    if (
      (data.plantName.toLowerCase() === plantName?.toLowerCase() ||
        catPlant.toLowerCase().replace(/[^a-z0-9]/g, '') === (plantName || '').toLowerCase().replace(/[^a-z0-9]/g, '')) &&
      (data.diseaseName.toLowerCase() === diseaseName?.toLowerCase() ||
        catDisease.toLowerCase().replace(/[^a-z0-9]/g, '') === (diseaseName || '').toLowerCase().replace(/[^a-z0-9]/g, ''))
    ) {
      return data
    }
  }

  // Substring or fuzzy disease match
  const searchDisease = (diseaseName || '').toLowerCase()
  for (const data of Object.values(KNOWLEDGE_CATALOG)) {
    if (
      (searchDisease.includes('early blight') && data.diseaseName.includes('Early blight')) ||
      (searchDisease.includes('late blight') && data.diseaseName.includes('Late blight')) ||
      (searchDisease.includes('rust') && data.diseaseName.includes('rust')) ||
      (searchDisease.includes('scab') && data.diseaseName.includes('scab')) ||
      (searchDisease.includes('bacterial spot') && data.diseaseName.includes('Bacterial spot')) ||
      (searchDisease.includes('leaf mold') && data.diseaseName.includes('Leaf mold')) ||
      (searchDisease.includes('spider mite') && data.diseaseName.includes('Spider mite')) ||
      (searchDisease.includes('mosaic') && data.diseaseName.includes('mosaic')) ||
      (searchDisease.includes('curl') && data.diseaseName.includes('Curl')) ||
      (searchDisease.includes('powdery mildew') && data.diseaseName.includes('Powdery mildew')) ||
      (searchDisease.includes('healthy') && data.diseaseName.includes('Healthy'))
    ) {
      return data
    }
  }

  return null
}

export { KNOWLEDGE_CATALOG }

