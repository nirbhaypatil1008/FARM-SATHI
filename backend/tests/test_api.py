"""
Comprehensive Test Suite for Krishi Saathi AI Backend.
Validates all major endpoints, business logic, security, and edge cases.
"""

import io
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Verifies backend health status endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_auth_and_farmer_lifecycle(client: TestClient):
    """
    Tests complete authentication lifecycle:
    1. Register new farmer
    2. Reject duplicate phone registration
    3. Log in with credentials
    4. Access protected /auth/me profile
    """
    farmer_data = {
        "name": "Surinder Singh",
        "phone_number": "9812345678",
        "password": "FarmPassword@2026",
        "preferred_language": "pa",
        "state": "Punjab",
        "district": "Ludhiana",
        "pincode": "141001"
    }

    # 1. Register
    reg_res = client.post("/api/v1/auth/register", json=farmer_data)
    assert reg_res.status_code == 201
    reg_json = reg_res.json()
    assert "access_token" in reg_json
    assert reg_json["farmer"]["phone_number"] == "9812345678"
    token = reg_json["access_token"]

    # 2. Duplicate registration rejection
    dup_res = client.post("/api/v1/auth/register", json=farmer_data)
    assert dup_res.status_code == 400
    dup_json = dup_res.json()
    err_msg = dup_json.get("error", {}).get("message") or dup_json.get("detail", "")
    assert "already registered" in err_msg

    # 3. Login
    login_res = client.post("/api/v1/auth/login", json={
        "phone_number": "9812345678",
        "password": "FarmPassword@2026"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Protected /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Surinder Singh"


def test_farm_and_crop_management(client: TestClient):
    """Tests creating farms, adding crops, and retrieving farm details."""
    # Register a new farmer
    reg = client.post("/api/v1/auth/register", json={
        "name": "Anand Rao",
        "phone_number": "9876501234",
        "password": "Pass@123456",
        "preferred_language": "te",
        "state": "Andhra Pradesh",
        "district": "Guntur"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Farm
    farm_data = {
        "farm_name": "Krishna River Delta Plot",
        "latitude": 16.3067,
        "longitude": 80.4365,
        "land_size_acres": 4.5,
        "soil_type": "Black",
        "irrigation_source": "Canal"
    }
    farm_res = client.post("/api/v1/farms", json=farm_data, headers=headers)
    assert farm_res.status_code == 201
    farm_id = farm_res.json()["id"]

    # Add Crop
    crop_data = {
        "farm_id": farm_id,
        "crop_name": "Chilli",
        "variety": "Teja",
        "sowing_date": "2026-09-15",
        "growth_stage": "Flowering"
    }
    crop_res = client.post(f"/api/v1/farms/{farm_id}/crops", json=crop_data, headers=headers)
    assert crop_res.status_code == 201
    assert crop_res.json()["crop_name"] == "Chilli"

    # List Crops for Farm
    crops_res = client.get(f"/api/v1/farms/{farm_id}/crops", headers=headers)
    assert crops_res.status_code == 200
    assert len(crops_res.json()) >= 1


def test_weather_and_agro_advisories(client: TestClient):
    """Tests weather retrieval by coordinates and verifies advisory structure."""
    res = client.get("/api/v1/weather?latitude=19.9975&longitude=73.7898")
    assert res.status_code == 200
    data = res.json()
    assert "current" in data
    assert "advisories" in data
    assert isinstance(data["advisories"], list)
    assert len(data["advisories"]) > 0


def test_smart_irrigation_calculation(client: TestClient):
    """Tests irrigation calculator under zero-rain and high-rain conditions."""
    # Condition A: Standard day without rain
    req_a = {
        "crop_name": "Wheat",
        "growth_stage": "Flowering",
        "soil_type": "Alluvial",
        "land_size_acres": 2.5,
        "pump_hp": 5.0,
        "recent_rain_mm": 0.0
    }
    res_a = client.post("/api/v1/irrigation/recommend", json=req_a)
    assert res_a.status_code == 200
    data_a = res_a.json()
    assert data_a["water_needed_liters"] > 0
    assert data_a["recommended_duration_minutes"] > 0
    assert not data_a["can_skip_irrigation"]

    # Condition B: High recent rain
    req_b = {
        "crop_name": "Wheat",
        "growth_stage": "Flowering",
        "soil_type": "Alluvial",
        "land_size_acres": 2.5,
        "pump_hp": 5.0,
        "recent_rain_mm": 30.0
    }
    res_b = client.post("/api/v1/irrigation/recommend", json=req_b)
    assert res_b.status_code == 200
    data_b = res_b.json()
    assert data_b["can_skip_irrigation"] is True
    assert data_b["recommended_duration_minutes"] == 0


def test_mandi_market_prices_and_comparison(client: TestClient):
    """Tests mandi price lookup and inter-mandi price arbitrage comparison."""
    # List Prices
    prices_res = client.get("/api/v1/market/prices?commodity=Onion")
    assert prices_res.status_code == 200
    prices = prices_res.json()
    assert len(prices) > 0

    # Compare Prices
    comp_res = client.post("/api/v1/market/compare", json={"commodity": "Onion"})
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["best_market"] is not None
    assert "recommendation" in comp_data


def test_government_schemes(client: TestClient):
    """Tests government welfare schemes catalog."""
    res = client.get("/api/v1/schemes")
    assert res.status_code == 200
    schemes = res.json()
    assert len(schemes) >= 3

    # Filter by category
    filter_res = client.get("/api/v1/schemes?category=Financial")
    assert filter_res.status_code == 200
    filtered = filter_res.json()
    assert any("PM-KISAN" in s["scheme_name"] for s in filtered)


def test_crop_disease_detection(client: TestClient):
    """Tests leaf image upload endpoint with multipart data."""
    fake_image = io.BytesIO(b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB")
    files = {"file": ("tomato_leaf.jpg", fake_image, "image/jpeg")}
    data = {"crop_name": "Tomato"}

    res = client.post("/api/v1/crop/detect", files=files, data=data)
    assert res.status_code == 200
    res_json = res.json()
    assert "detected_disease" in res_json
    assert "confidence_score" in res_json
    assert "expert_verification_needed" in res_json
    assert "organic_remedy" in res_json


def test_profit_calculator(client: TestClient):
    """Tests crop economics and profit calculator."""
    calc_req = {
        "crop_name": "Wheat",
        "land_size_acres": 2.0,
        "expected_yield_quintals_per_acre": 20.0,
        "expected_market_price_per_quintal": 2350.0,
        "seed_cost": 3000.0,
        "fertilizer_cost": 5000.0,
        "irrigation_electricity_cost": 2500.0,
        "labor_machinery_cost": 8000.0,
        "other_expenses": 1500.0
    }
    res = client.post("/api/v1/calculator/profit", json=calc_req)
    assert res.status_code == 200
    data = res.json()
    assert data["total_yield_quintals"] == 40.0
    assert data["gross_revenue"] == 94000.0
    assert data["total_expenses"] == 20000.0
    assert data["net_profit"] == 74000.0
    assert data["is_profitable"] is True


def test_ai_farmer_assistant_fallback(client: TestClient):
    """Tests AI assistant endpoint query with offline safe fallback."""
    ai_req = {
        "question": "गेहूं में पीला रतुआ (Yellow Rust) के लक्षण क्या हैं?",
        "language": "hi",
        "crop_context": "Wheat"
    }
    res = client.post("/api/v1/ai/ask", json=ai_req)
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert "suggested_actions" in data
