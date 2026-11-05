"""Scientific soil characteristics, health assessments, improvement recommendations,
and crop suitability for the 7 supported soil classes in FARM-SATHI.

Important Scientific Principle:
Visual analysis from photographs can only identify visual soil characteristics
and approximate soil classes. A photograph alone cannot reliably determine exact
soil pH, NPK (Nitrogen, Phosphorus, Potassium), electrical conductivity (EC),
organic carbon, or micronutrient concentrations.
"""

SOIL_KNOWLEDGE_BASE = {
    "Alluvial Soil": {
        "display_name": "Alluvial Soil",
        "description": "Formed by deposition of silt, clay, and sand brought down by rivers. Widely distributed in river basins and flood plains.",
        "characteristics": {
            "texture": "Loam to sandy loam and silty clay; generally porous and friable.",
            "color": "Light grey to ash grey and light yellowish-brown.",
            "visible_indicators": "Fine-grained texture with layered silt deposition; few coarse fragments.",
            "stones_gravel": "Usually minimal or absent in mature floodplains; may contain fine river pebbles near foothills.",
            "moisture_appearance": "Moderate to good surface moisture retention; smooth silt-like appearance.",
            "drainage": "Well-drained to moderately drained, depending on the proportion of silt and clay.",
        },
        "health_assessment": {
            "strengths": [
                "Naturally rich in potash, phosphoric acid, and lime.",
                "Excellent physical structure supporting deep root penetration.",
                "High agricultural productivity under balanced irrigation.",
            ],
            "limitations": [
                "Generally deficient in nitrogen and organic humus.",
                "Risk of waterlogging in low-lying riverbeds or heavy silt zones.",
                "Surface crusting may occur after heavy rains or flood recession.",
            ],
            "concerns": [
                "Intensive cultivation without organic replenishment can rapidly deplete organic carbon.",
                "Subsurface compaction from heavy tillage.",
            ],
            "recommended_tests": [
                "Available Nitrogen (Alkaline Permanganate method)",
                "Available Phosphorus (Olsen method)",
                "Available Potassium (Ammonium Acetate method)",
                "Organic Carbon percentage (Walkley-Black method)",
                "Soil pH and Electrical Conductivity (1:2 soil-water suspension)",
            ],
        },
        "recommendations": [
            "Incorporate farmyard manure (FYM) or compost at 10-12 tonnes/ha annually to replenish organic carbon.",
            "Practice green manuring (Sesbania/Dhaincha or Sunnhemp) prior to major crop planting.",
            "Apply balanced NPK fertilizers strictly in accordance with official Soil Health Card test values.",
            "Avoid over-irrigation in low-lying alluvial plots to prevent waterlogging and root rot.",
            "Practice crop rotation with deep-rooted leguminous pulses to fix atmospheric nitrogen.",
        ],
        "crop_suitability": {
            "primary_crops": ["Wheat", "Rice (Paddy)", "Sugarcane", "Maize", "Mustard", "Barley", "Jute"],
            "pulses_oilseeds": ["Chickpea", "Pigeon pea (Arhar)", "Lentil", "Soybean", "Groundnut"],
            "vegetables_fruits": ["Potato", "Onion", "Tomato", "Cauliflower", "Mango", "Banana"],
            "prerequisites": "Adequate seasonal water availability, balanced nitrogen supplementation, and certified seeds suited to the local agro-climatic zone.",
        },
        "fertilizer_principles": [
            "Exact fertilizer doses cannot be determined from a photograph.",
            "Obtain a certified laboratory soil test or Soil Health Card.",
            "Split application of nitrogenous fertilizers (e.g. Urea) is recommended to minimize leaching losses.",
            "Supplement with micronutrients (Zinc sulphate) if local soil test reveals zinc deficiency.",
        ],
    },
    "Black Soil": {
        "display_name": "Black Soil (Regur)",
        "description": "Also known as Regur or Black Cotton Soil, derived from volcanic basalt weathering. Renowned for its clayey texture and remarkable moisture retention.",
        "characteristics": {
            "texture": "Heavy clay to clayey loam; sticky and plastic when wet, hard when dry.",
            "color": "Deep black to dark brown or chestnut black.",
            "visible_indicators": "Prominent surface shrinkage cracks when dry; swells significantly when wet.",
            "stones_gravel": "Rarely stony; may contain scattered calcium carbonate nodules (kankar).",
            "moisture_appearance": "Retains moisture for extended periods; surface may appear self-ploughed due to shrink-swell cycles.",
            "drainage": "Slow internal drainage; highly prone to surface waterlogging during prolonged rainfall.",
        },
        "health_assessment": {
            "strengths": [
                "Exceptionally high water-holding capacity, sustaining crops through dry spells.",
                "Rich in calcium carbonate, magnesium carbonate, iron, aluminum, and potash.",
                "High Cation Exchange Capacity (CEC), retaining applied plant nutrients.",
            ],
            "limitations": [
                "Poor internal aeration and drainage during waterlogged periods.",
                "Extremely deficient in nitrogen, phosphorus, and organic matter.",
                "Difficult to till when either overly wet (sticky) or excessively dry (hard).",
            ],
            "concerns": [
                "Root asphyxiation and collar rot during heavy monsoons.",
                "High draft requirement for tillage machinery.",
            ],
            "recommended_tests": [
                "Soil pH (typically slightly alkaline, 7.5 to 8.5)",
                "Available Phosphorus (deficiency is very common)",
                "Available Nitrogen",
                "Soil Organic Carbon",
                "Free Calcium Carbonate (CaCO3) percentage",
            ],
        },
        "recommendations": [
            "Adopt Broad Bed and Furrow (BBF) or ridge-and-furrow planting systems to facilitate surface drainage.",
            "Incorporate well-decomposed FYM or vermicompost to improve soil aeration and aggregate stability.",
            "Carry out timely summer tillage (off-season ploughing) before heavy rains set in.",
            "Use deep-rooted crops like pigeon pea to break compact subsurface horizons.",
            "Apply phosphorus fertilizers in bands rather than broadcasting to reduce fixation by calcium.",
        ],
        "crop_suitability": {
            "primary_crops": ["Cotton", "Soybean", "Sorghum (Jowar)", "Chickpea (Gram)", "Wheat"],
            "pulses_oilseeds": ["Pigeon pea (Tur)", "Safflower", "Sunflower", "Linseed", "Green gram"],
            "cash_horticulture": ["Sugarcane (with drainage)", "Citrus (Sweet orange, Lime)", "Pomegranate", "Onion"],
            "prerequisites": "Adequate surface drainage management, timely sowing to avoid soil stickiness, and phosphorus supplementation based on soil tests.",
        },
        "fertilizer_principles": [
            "Never apply fertilizer blindly; exact doses require laboratory soil testing.",
            "Phosphorus is often strongly fixed in high-pH calcareous black soils; apply single super phosphate (SSP) or DAP in bands near the root zone.",
            "Use split doses of nitrogen to match crop uptake stages.",
        ],
    },
    "Red Soil": {
        "display_name": "Red Soil",
        "description": "Formed by the weathering of ancient crystalline and metamorphic rocks under warm, moderate-rainfall climates. Red color originates from iron oxide (ferric oxides).",
        "characteristics": {
            "texture": "Porous, friable, sandy to loamy on uplands; clayey in lowlands.",
            "color": "Reddish brown to rusty red, brick red, or reddish yellow.",
            "visible_indicators": "Light and loose soil aggregates; visible iron oxide tint with moderate sand content.",
            "stones_gravel": "Frequent quartz pebbles, iron concretions, and coarse gravel on slopes.",
            "moisture_appearance": "Dries out quickly after rain or irrigation; low surface crusting.",
            "drainage": "Excessively to well-drained; rapid water infiltration.",
        },
        "health_assessment": {
            "strengths": [
                "Good physical structure, friable and easily cultivable across a wide moisture range.",
                "Good aeration supporting early root system proliferation.",
                "Low risk of waterlogging in upland positions.",
            ],
            "limitations": [
                "Low moisture-holding capacity; crops suffer quickly from brief dry spells.",
                "Generally deficient in nitrogen, phosphorus, potassium, humus, and lime.",
                "Slightly acidic to neutral reaction (pH 5.5 to 7.0).",
            ],
            "concerns": [
                "High vulnerability to sheet and rill water erosion on undulating terrain.",
                "Nutrient leaching during heavy rainfall.",
            ],
            "recommended_tests": [
                "Soil pH (check for potential subsoil acidity)",
                "Organic Carbon percentage (often below 0.4%)",
                "Available N, P, and K",
                "Exchangeable Bases (Calcium and Magnesium)",
                "Micronutrients (Boron and Zinc are frequently low)",
            ],
        },
        "recommendations": [
            "Incorporate generous amounts of organic manures, compost, and bio-mulch to boost water retention.",
            "Adopt contour bunding, vetiver hedges, and conservation tillage to curb topsoil runoff.",
            "Install micro-irrigation systems (drip or sprinkler) to provide frequent, controlled moisture.",
            "Apply green manures such as sunnhemp or cowpea to build biological fertility.",
            "Use split doses of chemical fertilizers to prevent downward leaching beyond the root zone.",
        ],
        "crop_suitability": {
            "primary_crops": ["Groundnut", "Finger Millet (Ragi)", "Redgram (Pigeon pea)", "Castor", "Tobacco"],
            "pulses_oilseeds": ["Cowpea", "Horse gram", "Black gram", "Sesame (Til)", "Soybean"],
            "horticulture": ["Mango", "Guava", "Papaya", "Pomegranate", "Chilli", "Tomato"],
            "prerequisites": "Assured supplemental irrigation or moisture-conserving mulching, organic matter enrichment, and split nutrient application.",
        },
        "fertilizer_principles": [
            "A visual classification cannot determine fertilizer dosages; obtain an official Soil Health Card.",
            "Red soils benefit from integrated nutrient management: 50% organic compost + 50% test-based inorganic NPK.",
            "In slightly acidic red soils, rock phosphate or lime may be recommended based on lab pH results.",
        ],
    },
    "Laterite Soil": {
        "display_name": "Laterite Soil",
        "description": "Formed under tropical conditions with alternate wet and dry seasons, resulting from intense chemical leaching of silica and accumulation of iron and aluminum oxides.",
        "characteristics": {
            "texture": "Coarse, porous, cellular; gravelly to clayey loam.",
            "color": "Reddish brown to brick red; dark yellow-brown when moist.",
            "visible_indicators": "Vesicular structure with iron/manganese concretions (nodules); hardens on exposure.",
            "stones_gravel": "High concentration of hard ferruginous nodules and gravelly fragments.",
            "moisture_appearance": "Porous surface that allows rapid percolation; dries quickly on exposure.",
            "drainage": "Very rapid internal drainage; low moisture retention.",
        },
        "health_assessment": {
            "strengths": [
                "Good physical stability and resistance to water dispersion once established.",
                "Well suited to deep-rooted perennial plantation and fruit crops.",
                "Negligible risk of root waterlogging.",
            ],
            "limitations": [
                "Intensely leached of bases (calcium, magnesium, potassium).",
                "Strongly acidic (pH typically 4.5 to 5.8).",
                "High phosphorus fixation by iron and aluminum oxides.",
                "Very poor in organic matter, nitrogen, and available phosphorus.",
            ],
            "concerns": [
                "Severe aluminum and manganese toxicity if soil pH drops below 5.0.",
                "Phosphorus starvation in shallow-rooted seasonal crops.",
            ],
            "recommended_tests": [
                "Soil pH (critical for determining liming requirements)",
                "Exchangeable Acidity and Aluminum content",
                "Available Phosphorus (Bray P1 method for acidic soils)",
                "Available Potassium, Calcium, and Magnesium",
                "Organic Carbon percentage",
            ],
        },
        "recommendations": [
            "Apply agricultural lime or dolomite at lab-recommended rates to correct acidity and supply calcium/magnesium.",
            "Use rock phosphate or phosphate-solubilizing bacteria (PSB) rather than soluble phosphates prone to fixation.",
            "Establish thick organic mulches or cover crops (e.g. Mucuna, Calopogonium) in plantation basins.",
            "Incorporate biochar or high-humus compost to increase cation retention.",
            "Construct terrace bunds and silt retention pits on hillside plantations.",
        ],
        "crop_suitability": {
            "primary_crops": ["Cashew", "Rubber", "Tea", "Coffee", "Coconut", "Arecanut"],
            "fruits_spices": ["Black Pepper", "Cardamom", "Pineapple", "Tapioca (Cassava)", "Ginger", "Turmeric"],
            "field_crops": ["Rice (in terraced valleys with liming)", "Sweet potato", "Cowpea"],
            "prerequisites": "Soil pH neutralization (liming) for non-acid-tolerant crops, phosphorus management, and organic cover.",
        },
        "fertilizer_principles": [
            "Visual images cannot measure soil acidity or lime requirement.",
            "Always test soil pH before applying lime; over-liming can induce micronutrient deficiencies.",
            "In acidic laterites, apply water-insoluble rock phosphate for gradual, sustained release.",
        ],
    },
    "Arid Soil": {
        "display_name": "Arid Soil (Sandy/Desert)",
        "description": "Formed in arid and semi-arid regions with low rainfall and high evaporation rates. Characterized by high sand percentage and loose, single-grain structure.",
        "characteristics": {
            "texture": "Coarse sand to loamy sand; loose, non-cohesive grains.",
            "color": "Light brown, buff, yellowish-brown to pale grey.",
            "visible_indicators": "Individual sand particles clearly visible; lacks cohesive clods; shifts easily with wind.",
            "stones_gravel": "Fine to medium quartz sand; scattered surface gravel or desert varnish.",
            "moisture_appearance": "Extremely dry appearance; surface water infiltrates almost instantaneously.",
            "drainage": "Excessively drained; very low water retention capacity.",
        },
        "health_assessment": {
            "strengths": [
                "Excellent aeration and zero waterlogging hazard.",
                "Can be highly productive when managed with precision drip fertigation.",
                "Often contains adequate calcium carbonate and potassium minerals.",
            ],
            "limitations": [
                "Extremely low moisture retention capacity.",
                "Severe deficit of organic matter, humus, and nitrogen.",
                "Susceptible to high salinity or alkalinity where irrigation water has dissolved salts.",
            ],
            "concerns": [
                "Severe wind erosion and shifting sands burying young seedlings.",
                "Rapid leaching of all water-soluble nutrients.",
            ],
            "recommended_tests": [
                "Electrical Conductivity (EC) to check for soil salinity",
                "Soil pH (often alkaline, 8.0 to 9.0)",
                "Sodium Adsorption Ratio (SAR) or Exchangeable Sodium Percentage (ESP)",
                "Available Nitrogen, Phosphorus, and Potassium",
                "Irrigation Water Quality analysis (TDS and Boron)",
            ],
        },
        "recommendations": [
            "Plant shelterbelts and windbreaks (e.g. Acacia tortilis, Prosopis cineraria) along field borders to halt wind erosion.",
            "Adopt drip irrigation exclusively to deliver water and nutrients directly to the root zone.",
            "Incorporate crop residues, FYM, pressmud, or organic mulch to build surface moisture retention.",
            "Use split fertigation for nitrogen instead of single large top dressings.",
            "Grow drought-tolerant green manure crops like cluster bean during the monsoon window.",
        ],
        "crop_suitability": {
            "primary_crops": ["Pearl Millet (Bajra)", "Cluster Bean (Guar)", "Moth Bean", "Barley (irrigated)"],
            "oilseeds_pulses": ["Mustard", "Sesame", "Castor", "Gram (Chickpea under irrigation)"],
            "arid_horticulture": ["Date Palm", "Ber (Indian Jujube)", "Pomegranate", "Amla", "Kair"],
            "prerequisites": "Drip irrigation availability, wind erosion protection, salinity monitoring of both soil and irrigation water.",
        },
        "fertilizer_principles": [
            "Do not apply synthetic fertilizers without a soil test, especially in saline-prone arid belts.",
            "Broadcast application is wasteful; use localized fertigation to feed root zones directly.",
            "Monitor irrigation water salinity closely to prevent secondary salinization.",
        ],
    },
    "Mountain Soil": {
        "display_name": "Mountain Soil (Forest Soil)",
        "description": "Found on hilly and mountainous terrains with sufficient rainfall and forest canopy. Varies widely with altitude, slope aspect, and vegetation cover.",
        "characteristics": {
            "texture": "Silty loam to sandy loam in valleys; coarse, stony, and shallow on steep slopes.",
            "color": "Dark brown to blackish brown in topsoil; lighter brown in subsoil.",
            "visible_indicators": "Layer of decomposing leaf litter and organic humus on surface; crumb structure.",
            "stones_gravel": "Abundant angular rock fragments, shale, and gravel on slopes.",
            "moisture_appearance": "Moist, spongy surface feel under shade; dries rapidly on exposed south-facing slopes.",
            "drainage": "Well-drained to excessive on slopes; moderate in valley depressions.",
        },
        "health_assessment": {
            "strengths": [
                "Often relatively rich in surface humus and organic matter from forest litter.",
                "Good physical crumb structure in valley terraces.",
                "Favorable micro-climate for temperate crops and spices.",
            ],
            "limitations": [
                "Shallow soil depth on steep slopes prone to mass wasting.",
                "Slightly to moderately acidic due to organic acid accumulation and leaching.",
                "Deficient in available phosphorus and potash.",
            ],
            "concerns": [
                "Extreme vulnerability to water erosion, landslides, and topsoil loss during heavy rains.",
                "Variable micro-climates across slope aspects.",
            ],
            "recommended_tests": [
                "Soil pH (determines suitability for acid-loving vs neutral crops)",
                "Available Phosphorus (frequently tied up in organic/aluminum complexes)",
                "Available Potassium",
                "Soil depth measurement across terraces",
                "Soil Organic Matter percentage",
            ],
        },
        "recommendations": [
            "Maintain strict contour terracing, stone-pitching, and vegetative buffer strips across slopes.",
            "Keep the soil covered with grass mulches or perennial ground covers to absorb heavy rain impact.",
            "Apply agricultural lime or wood ash if soil pH is excessively low for intended vegetables.",
            "Incorporate mycorrhizal biofertilizers to improve phosphorus uptake in mountain orchards.",
            "Avoid excessive chemical tillage that disrupts natural crumb aggregation.",
        ],
        "crop_suitability": {
            "primary_crops": ["Apple", "Pear", "Peach", "Plum", "Tea", "Coffee (Hills)"],
            "field_crops": ["Maize", "Barley", "Buckwheat", "Amaranth", "Millets"],
            "spices_vegetables": ["Cardamom", "Ginger", "Turmeric", "Potato", "Off-season peas", "Cabbage"],
            "prerequisites": "Terrace stability, slope stabilization against erosion, frost management for temperate fruits.",
        },
        "fertilizer_principles": [
            "A visual classification cannot determine fertilizer dosages; obtain an official laboratory test.",
            "Opt for organic manures and composts that enhance aggregate stability on sloping ground.",
            "Avoid surface broadcast of soluble nitrogen before anticipated hill cloudbursts or heavy downpours.",
        ],
    },
    "Yellow Soil": {
        "display_name": "Yellow Soil",
        "description": "Formed in association with red soils in areas of high hydration. The ferric oxides undergo hydration, resulting in a distinct yellow to golden-brown color.",
        "characteristics": {
            "texture": "Fine loamy to silty clay loam; softer and more cohesive than coarse red soil.",
            "color": "Yellow, pale ochre, yellowish-red to golden brown.",
            "visible_indicators": "Fine-textured appearance; smoother feel than upland red soil; moderate cohesion.",
            "stones_gravel": "Fewer surface stones than adjacent red uplands; occasional fine quartz grit.",
            "moisture_appearance": "Retains moisture longer than red soils due to higher silt/clay hydration.",
            "drainage": "Moderately well-drained; slower surface runoff than steep red soils.",
        },
        "health_assessment": {
            "strengths": [
                "Better water retention than coarse sandy red soils.",
                "Good workability and friability under normal moisture.",
                "Moderate cation retention for applied fertilizers.",
            ],
            "limitations": [
                "Deficient in nitrogen, phosphorus, and organic carbon.",
                "Slightly acidic to neutral reaction.",
                "Prone to surface crusting if organic matter is depleted.",
            ],
            "concerns": [
                "Erosion during concentrated monsoon flows in valley transitions.",
                "Nutrient imbalance under monocropping.",
            ],
            "recommended_tests": [
                "Soil pH (1:2 water suspension)",
                "Available Nitrogen (N)",
                "Available Phosphorus (P)",
                "Available Potassium (K)",
                "Organic Carbon percentage",
            ],
        },
        "recommendations": [
            "Incorporate 8-10 tonnes/ha of FYM or vermicompost to preserve granular soil structure.",
            "Grow green manure crops (Dhaincha or Cowpea) before planting primary field crops.",
            "Use split doses of nitrogen to balance crop vegetative and reproductive stages.",
            "Practice ridge-and-furrow planting to optimize root-zone moisture during erratic rainfall.",
            "Rotate cereals with grain legumes (pulses) to maintain soil nitrogen balances.",
        ],
        "crop_suitability": {
            "primary_crops": ["Rice (Paddy in valleys)", "Pulses (Green gram, Black gram)", "Maize", "Groundnut"],
            "oilseeds_millets": ["Sesame", "Linseed", "Finger Millet (Ragi)", "Mustard"],
            "vegetables": ["Brinjal (Eggplant)", "Tomato", "Chilli", "Okra", "Beans"],
            "prerequisites": "Balanced nutrient replenishment, organic matter building, and regular soil testing.",
        },
        "fertilizer_principles": [
            "A visual classification cannot determine fertilizer dosages; obtain an official Soil Health Card.",
            "Combine organic manures with test-based NPK applications.",
            "Apply phosphorus in bands to maximize uptake efficiency.",
        ],
    },
}


def get_soil_report(soil_category: str | None) -> dict:
    """Return scientific characteristics, health assessment, recommendations, and crop suitability."""
    if not soil_category or soil_category not in SOIL_KNOWLEDGE_BASE:
        return {
            "display_name": soil_category or "Unidentified Soil Sample",
            "description": "Visual classification was inconclusive or unsupported.",
            "characteristics": {
                "texture": "Requires laboratory texture-by-feel or hydrometer analysis.",
                "color": "Requires standard Munsell soil color chart matching.",
                "visible_indicators": "Visual features could not be reliably determined.",
                "stones_gravel": "Requires visual field inspection.",
                "moisture_appearance": "Requires tensiometer or gravimetric testing.",
                "drainage": "Requires soil percolation test or hydraulic conductivity measurement.",
            },
            "health_assessment": {
                "strengths": ["Visual analysis alone cannot verify soil strengths."],
                "limitations": ["Visual analysis alone cannot verify soil limitations."],
                "concerns": ["Submit sample for comprehensive laboratory soil testing."],
                "recommended_tests": [
                    "Soil Health Card complete parameter testing (pH, EC, OC, N, P, K, S, Zn, Fe, Cu, Mn, B)"
                ],
            },
            "recommendations": [
                "Collect a representative V-shaped soil sample from 0-15 cm depth across your plot.",
                "Send the sample to the nearest Krishi Vigyan Kendra (KVK) or government soil testing laboratory.",
                "Apply organic compost to maintain general soil biological health.",
            ],
            "crop_suitability": {
                "primary_crops": ["Consult local agricultural officer based on laboratory Soil Health Card."],
                "pulses_oilseeds": [],
                "vegetables_fruits": [],
                "prerequisites": "Complete laboratory soil analysis and local agro-climatic assessment.",
            },
            "fertilizer_principles": [
                "Exact fertilizer doses cannot be determined from photographs.",
                "Obtain a certified laboratory soil test before purchasing fertilizers.",
            ],
        }

    return SOIL_KNOWLEDGE_BASE[soil_category]

