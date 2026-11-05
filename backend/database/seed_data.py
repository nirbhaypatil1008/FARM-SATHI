"""
Initial Database Seeding Module.
Seeds verified Government Welfare Schemes and APMC Mandi benchmark data
if tables are currently empty.
"""

from datetime import date
from sqlalchemy.orm import Session
from models.scheme import GovernmentScheme
from models.market import MarketPrice


def seed_default_data(db: Session):
    """Inserts initial verified agricultural schemes and market rates."""

    # 1. Seed Verified Government Schemes
    if db.query(GovernmentScheme).count() == 0:
        schemes = [
            GovernmentScheme(
                scheme_name="PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
                category="Financial",
                description="Central sector scheme to provide income support of Rs 6,000 per year in three equal installments to all landholding farmer families across the country.",
                eligibility_criteria="All landholding farmer families having cultivable landholding in their names. Institutional landholders and high-income taxpayers excluded.",
                benefits="Rs. 6,000 per year directly credited to the beneficiary's Aadhaar-linked bank account in 3 installments of Rs. 2,000.",
                documents_required="Aadhaar Card, Land ownership papers (Khatauni/Khasra), Bank Account details.",
                portal_url="https://pmkisan.gov.in/",
                is_verified=True,
            ),
            GovernmentScheme(
                scheme_name="PMFBY (Pradhan Mantri Fasal Bima Yojana)",
                category="Insurance",
                description="Comprehensive crop insurance scheme providing financial support to farmers suffering crop loss or damage arising out of unforeseen weather events and pests.",
                eligibility_criteria="All farmers growing notified crops in notified areas including sharecroppers and tenant farmers.",
                benefits="Uniform maximum premium of 2% for Kharif crops, 1.5% for Rabi crops, and 5% for commercial/horticultural crops. Balance premium paid by Government.",
                documents_required="Land record document, Sowing certificate, Bank passbook, Aadhaar card.",
                portal_url="https://pmfby.gov.in/",
                is_verified=True,
            ),
            GovernmentScheme(
                scheme_name="Kisan Credit Card (KCC) Scheme",
                category="Credit",
                description="Provides timely access to short-term formal institutional credit for cultivation, post-harvest expenses, and maintenance of farm assets at subsidized interest rates.",
                eligibility_criteria="Individual or joint farmer cultivators, tenant farmers, oral lessees, sharecroppers, and Self Help Groups of farmers.",
                benefits="Credit limit based on land and cropping pattern with interest subvention up to 3% for prompt repayment (effective interest rate as low as 4% p.a.).",
                documents_required="Duly filled application form, Identity proof, Address proof, Land record certified by revenue authorities.",
                portal_url="https://www.myscheme.gov.in/schemes/kcc",
                is_verified=True,
            ),
            GovernmentScheme(
                scheme_name="PMKSY - Per Drop More Crop (Micro Irrigation)",
                category="Irrigation",
                description="Promotes precision water application technologies like drip and sprinkler irrigation to enhance water use efficiency and farm productivity.",
                eligibility_criteria="Farmers of all categories who possess cultivable land. Preference given to Small and Marginal Farmers.",
                benefits="Subsidies ranging from 45% to 55% on the installation cost of drip and sprinkler irrigation equipment.",
                documents_required="Aadhaar, Land ownership documents, Water source certification, Bank details.",
                portal_url="https://pmksy.gov.in/",
                is_verified=True,
            ),
            GovernmentScheme(
                scheme_name="Soil Health Card Scheme",
                category="Soil & Nutrient",
                description="Provides farmers with soil test-based nutrient management advisories to optimize fertilizer dosage and enhance long-term soil fertility.",
                eligibility_criteria="Open to all farmers in rural India through district agriculture departments.",
                benefits="Customized fertilizer and organic manure recommendations for 12 essential soil parameters every 2 years.",
                documents_required="Farmer identity, Land coordinates for sample collection.",
                portal_url="https://soilhealth.dac.gov.in/",
                is_verified=True,
            ),
        ]
        db.add_all(schemes)
        db.commit()

    # 2. Seed Sample Market Mandi Prices
    if db.query(MarketPrice).count() == 0:
        prices = [
            MarketPrice(
                state="Maharashtra",
                district="Nashik",
                market_name="Lasalgaon APMC",
                commodity="Onion",
                variety="Red",
                min_price=1650.0,
                max_price=2450.0,
                modal_price=2100.0,
                price_date=date.today(),
                data_source="Agmarknet",
                is_outdated=False,
            ),
            MarketPrice(
                state="Maharashtra",
                district="Pune",
                market_name="Pune APMC",
                commodity="Onion",
                variety="Red",
                min_price=1700.0,
                max_price=2600.0,
                modal_price=2250.0,
                price_date=date.today(),
                data_source="Agmarknet",
                is_outdated=False,
            ),
            MarketPrice(
                state="Punjab",
                district="Ludhiana",
                market_name="Khanna APMC",
                commodity="Wheat",
                variety="PBW-343",
                min_price=2275.0,
                max_price=2450.0,
                modal_price=2350.0,
                price_date=date.today(),
                data_source="Agmarknet",
                is_outdated=False,
            ),
            MarketPrice(
                state="Haryana",
                district="Karnal",
                market_name="Karnal APMC",
                commodity="Wheat",
                variety="Sharbati",
                min_price=2300.0,
                max_price=2650.0,
                modal_price=2450.0,
                price_date=date.today(),
                data_source="Agmarknet",
                is_outdated=False,
            ),
            MarketPrice(
                state="Gujarat",
                district="Rajkot",
                market_name="Rajkot APMC",
                commodity="Cotton",
                variety="Shankar-6",
                min_price=6800.0,
                max_price=7600.0,
                modal_price=7250.0,
                price_date=date.today(),
                data_source="Agmarknet",
                is_outdated=False,
            ),
            MarketPrice(
                state="Andhra Pradesh",
                district="Guntur",
                market_name="Guntur APMC",
                commodity="Chilli",
                variety="Teja",
                min_price=18500.0,
                max_price=22000.0,
                modal_price=20500.0,
                price_date=date.today(),
                data_source="Agmarknet",
                is_outdated=False,
            ),
            MarketPrice(
                state="Karnataka",
                district="Kolar",
                market_name="Kolar APMC",
                commodity="Tomato",
                variety="Hybrid",
                min_price=1200.0,
                max_price=1800.0,
                modal_price=1500.0,
                price_date=date.today(),
                data_source="Agmarknet",
                is_outdated=False,
            ),
            MarketPrice(
                state="Madhya Pradesh",
                district="Indore",
                market_name="Indore APMC",
                commodity="Soybean",
                variety="Yellow",
                min_price=4400.0,
                max_price=4850.0,
                modal_price=4650.0,
                price_date=date.today(),
                data_source="Agmarknet",
                is_outdated=False,
            ),
        ]
        db.add_all(prices)
        db.commit()
