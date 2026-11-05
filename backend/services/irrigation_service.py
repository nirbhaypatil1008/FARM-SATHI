"""
Smart Irrigation Calculation Engine.
Implements FAO-56 Penman-Monteith rule-based water demand algorithms.
Calculates crop stage evapotranspiration (ETc), soil water deficit, and pump runtime.
"""

import math
from typing import Dict, Any

# FAO-56 Crop Stage Coefficients (Kc)
CROP_KC_VALUES = {
    "wheat": {"seedling": 0.40, "vegetative": 0.80, "flowering": 1.15, "maturity": 0.65},
    "rice": {"seedling": 1.05, "vegetative": 1.20, "flowering": 1.35, "maturity": 0.90},
    "cotton": {"seedling": 0.45, "vegetative": 0.85, "flowering": 1.20, "maturity": 0.70},
    "tomato": {"seedling": 0.60, "vegetative": 0.85, "flowering": 1.15, "maturity": 0.80},
    "potato": {"seedling": 0.50, "vegetative": 0.80, "flowering": 1.15, "maturity": 0.75},
    "maize": {"seedling": 0.40, "vegetative": 0.85, "flowering": 1.20, "maturity": 0.60},
    "onion": {"seedling": 0.50, "vegetative": 0.75, "flowering": 1.05, "maturity": 0.75},
    "soybean": {"seedling": 0.40, "vegetative": 0.80, "flowering": 1.15, "maturity": 0.50},
    "default": {"seedling": 0.45, "vegetative": 0.80, "flowering": 1.15, "maturity": 0.70}
}

# Soil Available Water Retention Factor
SOIL_FACTORS = {
    "sandy": 0.75,    # Low water retention, higher frequency needed
    "loamy": 1.00,    # Ideal retention
    "alluvial": 1.00, # Ideal retention
    "red": 0.90,      # Moderate retention
    "black": 1.25,    # High clay content, excellent moisture retention
    "clay": 1.20
}


class IrrigationService:
    def calculate_recommendation(
        self,
        crop_name: str,
        growth_stage: str,
        soil_type: str,
        land_size_acres: float,
        pump_hp: float = 5.0,
        recent_rain_mm: float = 0.0,
        forecast_rain_mm: float = 0.0,
        et0_reference_mm: float = 4.5
    ) -> Dict[str, Any]:
        """
        Calculates transparent rule-based water requirement and pump duration.
        """
        crop_key = crop_name.strip().lower()
        stage_key = growth_stage.strip().lower()
        soil_key = soil_type.strip().lower()

        # 1. Lookup Crop Coefficient (Kc)
        crop_stages = CROP_KC_VALUES.get(crop_key, CROP_KC_VALUES["default"])
        kc = crop_stages.get(stage_key, 0.80)

        # 2. Lookup Soil Adjustment Factor
        soil_retention = SOIL_FACTORS.get(soil_key, 1.0)

        # 3. Calculate Crop Evapotranspiration (ETc in mm/day)
        etc = et0_reference_mm * kc

        # 4. Net Water Deficit (considering rainfall)
        # If recent rain happened or rain is forecasted, water needed is reduced
        effective_rain = recent_rain_mm * 0.8  # 80% effective rainfall
        net_deficit_mm = max(0.0, (etc / soil_retention) - effective_rain)

        # 5. Check if irrigation can be skipped safely
        can_skip = False
        advice = ""

        if forecast_rain_mm >= 5.0:
            can_skip = True
            advice = (
                f"Significant rainfall ({forecast_rain_mm:.1f} mm) is forecasted in the next 24 hours. "
                "Skip scheduled irrigation to conserve water and prevent root waterlogging."
            )
            net_deficit_mm = 0.0
        elif recent_rain_mm >= 15.0:
            can_skip = True
            advice = (
                f"Recent rainfall ({recent_rain_mm:.1f} mm) has adequately recharged soil moisture. "
                "Postpone irrigation by 2-3 days."
            )
            net_deficit_mm = 0.0
        elif stage_key == "flowering":
            advice = (
                f"Crop is in critical Flowering stage (Kc = {kc:.2f}). "
                "Moisture stress at this phase causes blossom drop. Maintain timely light irrigation."
            )
        elif stage_key == "maturity":
            advice = (
                "Crop is nearing maturity. Taper off irrigation to encourage ripening and prevent lodging."
            )
        else:
            advice = (
                f"Soil moisture deficit is {net_deficit_mm:.1f} mm. "
                f"Irrigate as recommended to support vegetative growth in {soil_type} soil."
            )

        # 6. Convert mm of water to Liters for given acreage
        # 1 mm of water over 1 acre (4046.86 m2) = 4,046.86 Liters
        LITERS_PER_MM_PER_ACRE = 4046.86
        water_needed_liters = round(net_deficit_mm * LITERS_PER_MM_PER_ACRE * land_size_acres, 1)

        # 7. Calculate Pump Run Time
        # A 5 HP pump typically delivers ~40,000 Liters/hour (~8,000 L/hr per HP)
        pump_discharge_liters_per_hour = max(1000.0, pump_hp * 8000.0)
        pump_hours = water_needed_liters / pump_discharge_liters_per_hour if not can_skip else 0.0
        duration_minutes = int(math.ceil(pump_hours * 60))

        # Soil moisture status classification
        if can_skip:
            soil_status = "Saturated / Adequately Moist"
        elif net_deficit_mm > 5.0:
            soil_status = "High Moisture Deficit"
        else:
            soil_status = "Mild Moisture Deficit"

        calc_basis = (
            f"FAO-56 Formula: ETc ({etc:.2f} mm) = ET0 ({et0_reference_mm} mm) × Kc ({kc:.2f}). "
            f"Soil retention factor: {soil_retention}. Net deficit: {net_deficit_mm:.2f} mm over {land_size_acres} acres."
        )

        return {
            "crop_name": crop_name,
            "growth_stage": growth_stage,
            "water_needed_mm": round(net_deficit_mm, 2),
            "water_needed_liters": water_needed_liters,
            "recommended_duration_minutes": duration_minutes,
            "soil_moisture_status": soil_status,
            "rain_forecast_24h_mm": round(forecast_rain_mm, 1),
            "can_skip_irrigation": can_skip,
            "advice": advice,
            "calculation_basis": calc_basis
        }


irrigation_service = IrrigationService()
