/**
 * Grounded Agronomic Reference Schedules & Lifecycle Models
 * Source guidance: ICAR (Indian Council of Agricultural Research),
 * TNAU Agritech Portal, UAS Bangalore, and State Agricultural Universities.
 */

export const SUPPORTED_CROPS = [
  'Maize', 'Groundnut', 'Chickpea', 'Wheat', 'Cotton', 'Tomato',
  'Ragi', 'Paddy', 'Soybean', 'Sorghum', 'Chilli', 'Onion',
  'Green Gram', 'Mustard', 'Pigeon Pea', 'Sugarcane', 'Watermelon', 'Potato',
]

export const CROP_TEMPLATES = {
  Maize: {
    name: 'Maize (Corn)',
    category: 'Cereals & Millets',
    standardDuration: 105,
    stages: [
      { name: 'Land Preparation', startDas: -14, endDas: 0 },
      { name: 'Sowing & Germination', startDas: 0, endDas: 8 },
      { name: 'Seedling (Knee-high)', startDas: 8, endDas: 30 },
      { name: 'Vegetative & Tasseling', startDas: 30, endDas: 55 },
      { name: 'Silking & Pollination', startDas: 55, endDas: 70 },
      { name: 'Grain Filling (Dough)', startDas: 70, endDas: 90 },
      { name: 'Maturity', startDas: 90, endDas: 100 },
      { name: 'Harvesting', startDas: 100, endDas: 110 },
    ],
    tasks: [
      {
        das: -10,
        title: 'Deep Summer Ploughing & Soil Preparation',
        activityType: 'land_prep',
        stage: 'Land Preparation',
        priority: 'high',
        description: 'Plough field to a depth of 20-25 cm. Expose soil to sunlight to destroy pupae of soil pests and weed seeds.',
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: -3,
        title: 'Apply Farmyard Manure (FYM) Basal Dose',
        activityType: 'fertilizer',
        stage: 'Land Preparation',
        priority: 'high',
        description: 'Incorporate well-decomposed FYM or vermicompost into soil uniformly before final harrowing.',
        fertilizerDetails: { name: 'Well-decomposed Farmyard Manure (FYM)', quantityPerAcre: 4000, unit: 'kg/acre', method: 'Soil broadcast & incorporation' },
      },
      {
        das: 0,
        title: 'Seed Treatment & Sowing',
        activityType: 'sowing',
        stage: 'Sowing & Germination',
        priority: 'critical',
        description: 'Treat hybrid maize seed with Trichoderma viride (4g/kg seed). Maintain row-to-row spacing of 60 cm and plant-to-plant spacing of 20 cm at 4-5 cm depth.',
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 5,
        title: 'Germination & Stand Establishment Check',
        activityType: 'growth_monitoring',
        stage: 'Sowing & Germination',
        priority: 'medium',
        description: 'Check seedling emergence across field rows. Re-sow gaps within 7-8 days of initial sowing if seedling count is sparse.',
      },
      {
        das: 15,
        title: 'First Light Irrigation & Thinning',
        activityType: 'irrigation',
        stage: 'Seedling (Knee-high)',
        priority: 'medium',
        description: 'Provide light irrigation if rain has not occurred. Retain one healthy seedling per hill; remove excess weak seedlings.',
        irrigationDetails: { critical: false, method: 'Furrow or Drip', moistureTarget: 'Moist root zone' },
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 20,
        title: 'Scout for Fall Armyworm (FAW) on Young Whorls',
        activityType: 'pest_monitoring',
        stage: 'Seedling (Knee-high)',
        priority: 'high',
        description: 'Carefully inspect central leaf whorls for pinholes, windowpaning and sawdust-like frass indicating early Fall Armyworm. Hand-pick egg masses or apply Neem oil (5ml/L).',
        weatherSensitive: true,
        sensitivityType: 'wind',
      },
      {
        das: 30,
        title: 'First Top Dressing of Nitrogen & Earthing Up',
        activityType: 'fertilizer',
        stage: 'Vegetative & Tasseling',
        priority: 'high',
        description: 'Apply 1/3 dose of Nitrogen around plant base (5-7 cm away) followed by light earthing up to support sturdy root lodging resistance.',
        fertilizerDetails: { name: 'Urea (Nitrogen)', quantityPerAcre: 35, unit: 'kg/acre', method: 'Side placement & soil covering' },
      },
      {
        das: 35,
        title: 'Critical Irrigation at Knee-High Stage',
        activityType: 'irrigation',
        stage: 'Vegetative & Tasseling',
        priority: 'critical',
        description: 'Crucial irrigation period. Moisture stress at knee-high stage permanently stunts plant height and ear formation.',
        irrigationDetails: { critical: true, method: 'Furrow/Drip', moistureTarget: '60-70% Field Capacity' },
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 50,
        title: 'Second Top Dressing & Tasseling Inspection',
        activityType: 'fertilizer',
        stage: 'Vegetative & Tasseling',
        priority: 'high',
        description: 'Apply remaining 1/3 dose of Nitrogen just before tassel emergence. Inspect tassels for uniform emergence.',
        fertilizerDetails: { name: 'Urea (Nitrogen)', quantityPerAcre: 30, unit: 'kg/acre', method: 'Side dressing with irrigation' },
      },
      {
        das: 55,
        title: 'Crucial Irrigation at Tasseling & Silking Stage',
        activityType: 'irrigation',
        stage: 'Silking & Pollination',
        priority: 'critical',
        description: 'Most critical water demand stage. Moisture deficit during pollination leads to poor fertilization and barren cobs.',
        irrigationDetails: { critical: true, method: 'Furrow/Drip', moistureTarget: 'Optimum root moisture' },
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 75,
        title: 'Grain Filling Stage Irrigation & Cob Borer Check',
        activityType: 'irrigation',
        stage: 'Grain Filling (Dough)',
        priority: 'high',
        description: 'Ensure soil remains moist during grain filling. Inspect cob tips for earworms or fungal cob rot.',
        irrigationDetails: { critical: true, method: 'Furrow/Drip', moistureTarget: 'Moist' },
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 95,
        title: 'Stop Irrigation & Check Husk Drying',
        activityType: 'harvest_prep',
        stage: 'Maturity',
        priority: 'medium',
        description: 'Stop irrigation 10-12 days before anticipated harvest to let grain dry down. Check for black layer formation at grain base indicating physiological maturity.',
      },
      {
        das: 105,
        title: 'Harvesting & Shelling Maize Cobs',
        activityType: 'harvest',
        stage: 'Harvesting',
        priority: 'critical',
        description: 'Harvest cobs when outer husks turn dry, pale brown and grain moisture drops to ~18-20%. Dry in clean yard before shelling.',
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
    ],
  },

  Groundnut: {
    name: 'Groundnut (Peanut)',
    category: 'Oilseeds & Cash Crops',
    standardDuration: 115,
    stages: [
      { name: 'Land Preparation', startDas: -12, endDas: 0 },
      { name: 'Sowing & Emergence', startDas: 0, endDas: 10 },
      { name: 'Vegetative Growth', startDas: 10, endDas: 30 },
      { name: 'Flowering Stage', startDas: 30, endDas: 45 },
      { name: 'Pegging & Pod Formation', startDas: 45, endDas: 75 },
      { name: 'Pod Development & Filling', startDas: 75, endDas: 100 },
      { name: 'Maturity', startDas: 100, endDas: 110 },
      { name: 'Harvesting', startDas: 110, endDas: 120 },
    ],
    tasks: [
      {
        das: -7,
        title: 'Seedbed Preparation for Loose Soil Tilth',
        activityType: 'land_prep',
        stage: 'Land Preparation',
        priority: 'high',
        description: 'Work soil to a fine, friable tilth to ensure effortless peg penetration and pod development later.',
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 0,
        title: 'Rhizobium Seed Treatment & Sowing',
        activityType: 'sowing',
        stage: 'Sowing & Emergence',
        priority: 'critical',
        description: 'Inoculate kernels with Rhizobium culture and Trichoderma (10g/kg). Plant at 30 cm × 10 cm spacing at 4-5 cm depth.',
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 20,
        title: 'Intercultivation & First Weeding',
        activityType: 'weeding',
        stage: 'Vegetative Growth',
        priority: 'high',
        description: 'Carry out shallow hoeing and hand weeding. Keep plot clean of weeds before flowering begins.',
      },
      {
        das: 35,
        title: 'Critical Irrigation at Flowering Initiation',
        activityType: 'irrigation',
        stage: 'Flowering Stage',
        priority: 'critical',
        description: 'Maintain uniform root moisture as flowers emerge. Do not disturb soil mechanically once flowering starts.',
        irrigationDetails: { critical: true, method: 'Sprinkler/Furrow', moistureTarget: 'Uniformly moist' },
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 45,
        title: 'Apply Gypsum Basal Banding at Pegging',
        activityType: 'fertilizer',
        stage: 'Pegging & Pod Formation',
        priority: 'critical',
        description: 'Crucial application: Apply 150-200 kg Gypsum/acre near plant base and incorporate into top 2-3 cm soil. Provides essential Calcium and Sulfur for sound kernel filling and preventing "pops" (empty shells).',
        fertilizerDetails: { name: 'Agricultural Gypsum (Calcium + Sulfur)', quantityPerAcre: 150, unit: 'kg/acre', method: 'Soil banding around root zone' },
      },
      {
        das: 55,
        title: 'Critical Pegging Moisture Irrigation',
        activityType: 'irrigation',
        stage: 'Pegging & Pod Formation',
        priority: 'critical',
        description: 'Crucial period: Ensure topsoil is soft and moist so aerial pegs penetrate smoothly into the ground.',
        irrigationDetails: { critical: true, method: 'Sprinkler/Drip', moistureTarget: 'Soft friable topsoil' },
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 70,
        title: 'Scout for Tikka Leaf Spot & Rust',
        activityType: 'disease_inspection',
        stage: 'Pegging & Pod Formation',
        priority: 'high',
        description: 'Check lower leaves for dark brown circular Tikka lesions and orange-brown rust pustules. Spray neem formulation or 1% Bordeaux mixture preventatively.',
        weatherSensitive: true,
        sensitivityType: 'wind',
      },
      {
        das: 85,
        title: 'Pod Filling Stage Irrigation',
        activityType: 'irrigation',
        stage: 'Pod Development & Filling',
        priority: 'medium',
        description: 'Provide light irrigation to avoid pod shrivelling during seed enlargement.',
        irrigationDetails: { critical: false, method: 'Sprinkler/Furrow', moistureTarget: 'Moist' },
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 115,
        title: 'Harvesting & Inversion for Sun Drying',
        activityType: 'harvest',
        stage: 'Harvesting',
        priority: 'critical',
        description: 'Pull plants when 75% of pods show inner shell browning. Invert plants in sun for 3-5 days to dry pods down to 8% moisture for safe storage.',
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
    ],
  },

  Tomato: {
    name: 'Tomato',
    category: 'Vegetables & Horticulture',
    standardDuration: 135,
    stages: [
      { name: 'Nursery & Land Preparation', startDas: -25, endDas: 0 },
      { name: 'Transplanting & Establishment', startDas: 0, endDas: 15 },
      { name: 'Vegetative Growth & Staking', startDas: 15, endDas: 40 },
      { name: 'Flowering & Early Fruit Set', startDas: 40, endDas: 65 },
      { name: 'Fruit Development & Sizing', startDas: 65, endDas: 95 },
      { name: 'First Picking / Harvest', startDas: 95, endDas: 110 },
      { name: 'Continuous Pickings', startDas: 110, endDas: 135 },
    ],
    tasks: [
      {
        das: -10,
        title: 'Raised Bed Preparation & FYM Incorporation',
        activityType: 'land_prep',
        stage: 'Nursery & Land Preparation',
        priority: 'high',
        description: 'Form raised beds of 90 cm width and 15 cm height with 45 cm walking furrows. Mix 8 tons FYM/acre with Trichoderma.',
      },
      {
        das: 0,
        title: 'Transplanting Healthy Seedlings',
        activityType: 'sowing',
        stage: 'Transplanting & Establishment',
        priority: 'critical',
        description: 'Transplant 25-30 day old sturdy seedlings in evening hours. Maintain 60 cm × 45 cm spacing. Irrigate immediately after transplanting.',
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 10,
        title: 'Establishment Irrigation & Gap Filling',
        activityType: 'irrigation',
        stage: 'Transplanting & Establishment',
        priority: 'medium',
        description: 'Ensure roots have settled. Fill any dead seedling spots with reserved nursery seedlings.',
        irrigationDetails: { critical: false, method: 'Drip', moistureTarget: 'Moist root crown' },
      },
      {
        das: 25,
        title: 'Trellising / Staking with Bamboo Stakes',
        activityType: 'growth_monitoring',
        stage: 'Vegetative Growth & Staking',
        priority: 'high',
        description: 'Erect bamboo stakes and string wire trellising to keep foliage and upcoming fruit completely off wet ground.',
      },
      {
        das: 30,
        title: 'Scout for Leaf Curl Virus & Whitefly Vector',
        activityType: 'pest_monitoring',
        stage: 'Vegetative Growth & Staking',
        priority: 'high',
        description: 'Inspect underside of tender leaves for whiteflies. Erect yellow sticky traps (15/acre). Remove any stunted leaf-curl infected plants immediately.',
      },
      {
        das: 45,
        title: 'First Split Fertigation / Nutrient Dressing at Flowering',
        activityType: 'fertilizer',
        stage: 'Flowering & Early Fruit Set',
        priority: 'high',
        description: 'Apply balanced NPK with micronutrients (Boron + Calcium) to promote flower retention and prevent blossom end rot.',
        fertilizerDetails: { name: 'Water-Soluble 19-19-19 + Calcium Nitrate', quantityPerAcre: 15, unit: 'kg/acre', method: 'Drip fertigation or root drenching' },
      },
      {
        das: 55,
        title: 'Critical Irrigation during Flower & Fruit Set',
        activityType: 'irrigation',
        stage: 'Flowering & Early Fruit Set',
        priority: 'critical',
        description: 'Maintain steady, consistent soil moisture. Sudden moisture fluctuations cause flower drop and fruit cracking.',
        irrigationDetails: { critical: true, method: 'Drip', moistureTarget: 'Consistently moist' },
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 75,
        title: 'Inspect for Early Blight & Fruit Borer',
        activityType: 'disease_inspection',
        stage: 'Fruit Development & Sizing',
        priority: 'high',
        description: 'Inspect lower foliage for concentric target-spot lesions (Early Blight) and fruit for pin-holes from Helicoverpa borer.',
        weatherSensitive: true,
        sensitivityType: 'wind',
      },
      {
        das: 95,
        title: 'First Tomato Picking at Breaker / Turning Stage',
        activityType: 'harvest',
        stage: 'First Picking / Harvest',
        priority: 'high',
        description: 'Harvest fruit at breaker stage (slight pink/orange blush at blossom end) for distant marketing, or full red ripe for immediate local sales.',
      },
      {
        das: 110,
        title: 'Second Flush Harvesting & Follow-up Picking',
        activityType: 'harvest',
        stage: 'Continuous Pickings',
        priority: 'medium',
        description: 'Harvest mature fruits every 3-4 days in cool early morning hours. Grade and pack in plastic crates.',
      },
    ],
  },

  Paddy: {
    name: 'Paddy (Rice)',
    category: 'Cereals & Millets',
    standardDuration: 130,
    stages: [
      { name: 'Nursery & Puddling', startDas: -25, endDas: 0 },
      { name: 'Transplanting & Tillering', startDas: 0, endDas: 30 },
      { name: 'Panicle Initiation', startDas: 30, endDas: 60 },
      { name: 'Flowering / Heading', startDas: 60, endDas: 80 },
      { name: 'Grain Filling (Milky/Dough)', startDas: 80, endDas: 105 },
      { name: 'Maturity & Field Draining', startDas: 105, endDas: 120 },
      { name: 'Harvesting & Threshing', startDas: 120, endDas: 130 },
    ],
    tasks: [
      {
        das: -5,
        title: 'Field Puddling & Leveling',
        activityType: 'land_prep',
        stage: 'Nursery & Puddling',
        priority: 'high',
        description: 'Puddle soil thoroughly with tractor/bullock puddler and level with leveling board to minimize percolation water loss.',
      },
      {
        das: 0,
        title: 'Transplanting Paddy Seedlings',
        activityType: 'sowing',
        stage: 'Transplanting & Tillering',
        priority: 'critical',
        description: 'Transplant 20-25 day old seedlings at 2-3 seedlings per hill with 20 cm × 15 cm spacing. Maintain 2-3 cm standing water.',
      },
      {
        das: 15,
        title: 'Cono Weeding & Early Tillering Inspection',
        activityType: 'weeding',
        stage: 'Transplanting & Tillering',
        priority: 'medium',
        description: 'Operate rotary / cono-weeder between rows to incorporate weeds into mud and aerate roots for profuse tillering.',
      },
      {
        das: 25,
        title: 'First Top Dressing of Nitrogen (Urea)',
        activityType: 'fertilizer',
        stage: 'Transplanting & Tillering',
        priority: 'high',
        description: 'Drain excess water before broadcasting urea; re-irrigate after 24 hours to maximize Nitrogen uptake.',
        fertilizerDetails: { name: 'Urea (Nitrogen)', quantityPerAcre: 35, unit: 'kg/acre', method: 'Broadcast in drained field' },
      },
      {
        das: 45,
        title: 'Critical Water Management at Panicle Initiation',
        activityType: 'irrigation',
        stage: 'Panicle Initiation',
        priority: 'critical',
        description: 'Maintain 4-5 cm standing water during panicle formation. Moisture stress here causes high spikelet sterility.',
        irrigationDetails: { critical: true, method: 'Basin / Flooding', moistureTarget: '4-5 cm standing water' },
      },
      {
        das: 60,
        title: 'Scout for Stem Borer & Leaf Folder',
        activityType: 'pest_monitoring',
        stage: 'Flowering / Heading',
        priority: 'high',
        description: 'Inspect hills for dead hearts or folded leaves. Look out for Yellow Stem Borer egg masses; install pheromone traps (5/acre).',
      },
      {
        das: 75,
        title: 'Flowering Stage Water Management & Blast Check',
        activityType: 'irrigation',
        stage: 'Flowering / Heading',
        priority: 'critical',
        description: 'Maintain continuous shallow water layer (3-4 cm) during active flowering. Scout for spindle-shaped Blast lesions.',
        irrigationDetails: { critical: true, method: 'Basin', moistureTarget: 'Continuous shallow layer' },
      },
      {
        das: 105,
        title: 'Drain Water Completely 10-14 Days Before Harvest',
        activityType: 'harvest_prep',
        stage: 'Maturity & Field Draining',
        priority: 'high',
        description: 'Completely drain field water to harden soil for harvesters and accelerate uniform grain ripening.',
      },
      {
        das: 125,
        title: 'Harvesting & Threshing Paddy Crop',
        activityType: 'harvest',
        stage: 'Harvesting & Threshing',
        priority: 'critical',
        description: 'Harvest when 85% of grains in panicles turn golden yellow. Thresh promptly and sun-dry grain to 13% moisture.',
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
    ],
  },

  Wheat: {
    name: 'Wheat',
    category: 'Cereals & Millets',
    standardDuration: 120,
    stages: [
      { name: 'Land Preparation', startDas: -10, endDas: 0 },
      { name: 'Sowing & Crown Root Initiation', startDas: 0, endDas: 25 },
      { name: 'Tillering Stage', startDas: 25, endDas: 45 },
      { name: 'Jointing & Stem Extension', startDas: 45, endDas: 65 },
      { name: 'Flowering / Anthesis', startDas: 65, endDas: 85 },
      { name: 'Milk & Dough (Grain Filling)', startDas: 85, endDas: 105 },
      { name: 'Maturity & Harvest', startDas: 105, endDas: 120 },
    ],
    tasks: [
      {
        das: 0,
        title: 'Wheat Sowing with Seed-cum-Fertilizer Drill',
        activityType: 'sowing',
        stage: 'Sowing & Crown Root Initiation',
        priority: 'critical',
        description: 'Sow certified seed at 20-22 cm row spacing at 5 cm depth. Apply basal NPK at sowing time.',
        fertilizerDetails: { name: 'DAP (Di-Ammonium Phosphate) + MOP', quantityPerAcre: 50, unit: 'kg/acre', method: 'Drill placement below seed' },
      },
      {
        das: 21,
        title: 'Most Critical Irrigation at Crown Root Initiation (CRI)',
        activityType: 'irrigation',
        stage: 'Sowing & Crown Root Initiation',
        priority: 'critical',
        description: 'Absolute vital irrigation: Crown roots emerge at 20-22 DAS. Delaying irrigation past 25 DAS reduces tillering and final yield drastically.',
        irrigationDetails: { critical: true, method: 'Check Basin / Furrow', moistureTarget: 'Moist root zone' },
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 45,
        title: 'Second Irrigation & Top Dressing at Late Tillering',
        activityType: 'irrigation',
        stage: 'Tillering Stage',
        priority: 'high',
        description: 'Irrigate and top dress with remaining Nitrogen (Urea).',
        fertilizerDetails: { name: 'Urea (Nitrogen)', quantityPerAcre: 35, unit: 'kg/acre', method: 'Top dressing followed by irrigation' },
      },
      {
        das: 65,
        title: 'Late Jointing Stage Irrigation & Rust Scouting',
        activityType: 'irrigation',
        stage: 'Jointing & Stem Extension',
        priority: 'high',
        description: 'Provide irrigation at jointing. Check leaf blades for yellow stripe rust (Puccinia striiformis) pustules.',
      },
      {
        das: 85,
        title: 'Critical Irrigation at Flowering / Anthesis Stage',
        activityType: 'irrigation',
        stage: 'Flowering / Anthesis',
        priority: 'critical',
        description: 'Ensure adequate moisture during anthesis. Protect crop from terminal heat stress.',
        irrigationDetails: { critical: true, method: 'Sprinkler/Basin', moistureTarget: 'Moist' },
      },
      {
        das: 100,
        title: 'Final Light Irrigation at Dough Stage',
        activityType: 'irrigation',
        stage: 'Milk & Dough (Grain Filling)',
        priority: 'medium',
        description: 'Light irrigation on calm, windless day to prevent crop lodging while grains fill.',
        weatherSensitive: true,
        sensitivityType: 'wind',
      },
      {
        das: 118,
        title: 'Harvesting Wheat Crop with Combine / Sickle',
        activityType: 'harvest',
        stage: 'Maturity & Harvest',
        priority: 'critical',
        description: 'Harvest when grains become hard and dry (moisture below 12%). Store in airtight dry bins.',
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
    ],
  },
}

// Generate default fallback template for any crop not explicitly defined above
export function getCropTemplate(cropName) {
  const normalized = Object.keys(CROP_TEMPLATES).find(
    (key) => key.toLowerCase() === (cropName || '').toLowerCase().trim()
  )
  if (normalized) return CROP_TEMPLATES[normalized]

  // Generic balanced schedule for other crops
  return {
    name: cropName || 'General Crop',
    category: 'Field Crop',
    standardDuration: 110,
    stages: [
      { name: 'Land Preparation', startDas: -10, endDas: 0 },
      { name: 'Sowing & Germination', startDas: 0, endDas: 10 },
      { name: 'Vegetative Growth', startDas: 10, endDas: 40 },
      { name: 'Flowering & Reproduction', startDas: 40, endDas: 70 },
      { name: 'Maturity & Ripening', startDas: 70, endDas: 95 },
      { name: 'Harvesting', startDas: 95, endDas: 110 },
    ],
    tasks: [
      {
        das: -7,
        title: `Soil & Land Preparation for ${cropName}`,
        activityType: 'land_prep',
        stage: 'Land Preparation',
        priority: 'high',
        description: 'Plough and harrow field to create a friable seedbed. Add organic manure.',
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 0,
        title: `Sowing / Planting ${cropName}`,
        activityType: 'sowing',
        stage: 'Sowing & Germination',
        priority: 'critical',
        description: 'Sow certified quality seed at recommended spacing and depth into moist soil.',
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 15,
        title: 'Early Weed Management & Hoeing',
        activityType: 'weeding',
        stage: 'Vegetative Growth',
        priority: 'medium',
        description: 'Perform shallow weeding to remove weed competition and aerate root zone.',
      },
      {
        das: 25,
        title: 'Vegetative Stage Nutrient & Irrigation Check',
        activityType: 'fertilizer',
        stage: 'Vegetative Growth',
        priority: 'high',
        description: 'Top dress with recommended Nitrogen or organic liquid compost followed by irrigation.',
      },
      {
        das: 45,
        title: 'Crucial Irrigation at Flowering Stage',
        activityType: 'irrigation',
        stage: 'Flowering & Reproduction',
        priority: 'critical',
        description: 'Maintain adequate moisture to avoid blossom drop and support robust setting.',
        irrigationDetails: { critical: true, method: 'Furrow / Drip', moistureTarget: 'Moist' },
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
      {
        das: 60,
        title: 'Pest & Disease Field Scouting',
        activityType: 'pest_monitoring',
        stage: 'Flowering & Reproduction',
        priority: 'high',
        description: 'Inspect plants for early symptoms of foliar diseases, sucking pests or caterpillars.',
        weatherSensitive: true,
        sensitivityType: 'wind',
      },
      {
        das: 90,
        title: 'Pre-Harvest Field Inspection',
        activityType: 'harvest_prep',
        stage: 'Maturity & Ripening',
        priority: 'medium',
        description: 'Check maturity symptoms and arrange harvest labor or machinery.',
      },
      {
        das: 105,
        title: `Harvesting ${cropName}`,
        activityType: 'harvest',
        stage: 'Harvesting',
        priority: 'critical',
        description: 'Harvest mature produce in dry weather to avoid field losses and mould.',
        weatherSensitive: true,
        sensitivityType: 'rain',
      },
    ],
  }
}

/**
 * Generates an end-to-end farming calendar based on actual crop parameters,
 * soil type, irrigation setup, farm area, and sowing date.
 */
export function generateFarmingCalendar({
  cropName,
  cropVariety = '',
  sowingDate,
  farmArea = 1.0,
  soilType = 'Loamy',
  irrigationType = 'Drip',
  waterAvailability = 'Adequate',
  customDuration = null,
}) {
  const template = getCropTemplate(cropName)
  const duration = Number(customDuration) || template.standardDuration

  const sowing = new Date(`${sowingDate}T00:00:00`)
  if (Number.isNaN(sowing.getTime())) {
    throw new Error('Valid sowing date (YYYY-MM-DD) is required.')
  }

  // Calculate stage dates
  const stages = template.stages.map((st) => {
    const startDate = new Date(sowing.getTime() + st.startDas * 86400000).toISOString().slice(0, 10)
    const endDate = new Date(sowing.getTime() + st.endDas * 86400000).toISOString().slice(0, 10)
    return {
      name: st.name,
      startDas: st.startDas,
      endDas: st.endDas,
      startDate,
      endDate,
    }
  })

  // Calculate expected harvest date
  const harvestDas = template.stages.find((s) => s.name.toLowerCase().includes('harvest'))?.startDas || duration
  const expectedHarvestDate = new Date(sowing.getTime() + harvestDas * 86400000).toISOString().slice(0, 10)

  // Generate tasks tailored to soil & irrigation
  const area = Number(farmArea) || 1.0
  const tasks = template.tasks.map((t) => {
    // Soil-based adjustments for irrigation tasks
    let adjustedDas = t.das
    if (t.activityType === 'irrigation') {
      if (soilType.toLowerCase().includes('sand')) {
        // Sand holds less water; water 2 days earlier
        adjustedDas = Math.max(1, t.das - 2)
      } else if (soilType.toLowerCase().includes('black') || soilType.toLowerCase().includes('clay')) {
        // Black / clay retains moisture longer; postpone interval by 2 days
        adjustedDas = t.das + 2
      }
    }

    const scheduledDate = new Date(sowing.getTime() + adjustedDas * 86400000).toISOString().slice(0, 10)

    // Scale fertilizer quantities by area
    let fertilizerDetails = null
    if (t.fertilizerDetails) {
      const scaledTotal = Math.round((t.fertilizerDetails.quantityPerAcre || 0) * area)
      fertilizerDetails = {
        ...t.fertilizerDetails,
        totalQuantity: scaledTotal,
        areaAcres: area,
      }
    }

    return {
      title: t.title,
      activityType: t.activityType,
      stageName: t.stage,
      scheduledDate,
      originalDate: scheduledDate,
      priority: t.priority,
      description: t.description,
      fertilizerDetails: fertilizerDetails ? JSON.stringify(fertilizerDetails) : null,
      irrigationDetails: t.irrigationDetails ? JSON.stringify(t.irrigationDetails) : null,
      weatherSensitive: Boolean(t.weatherSensitive),
      sensitivityType: t.sensitivityType || 'none',
      status: 'pending',
    }
  })

  // Sort tasks by scheduledDate
  tasks.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))

  return {
    cropName: template.name,
    cropVariety: cropVariety || 'Standard Hybrid',
    farmArea: area,
    sowingDate,
    cropDurationDays: duration,
    expectedHarvestDate,
    soilType,
    irrigationType,
    waterAvailability,
    stages,
    tasks,
  }
}

