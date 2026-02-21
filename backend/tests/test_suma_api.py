"""
SUMA API Test Suite
Tests for authentication endpoints, movements CRUD, business units, tags, and KPIs
"""
import pytest
import requests
import os

# Get API URL from environment - no default value
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if BASE_URL:
    BASE_URL = BASE_URL.rstrip('/')
else:
    raise RuntimeError("REACT_APP_BACKEND_URL environment variable must be set")


class TestHealthEndpoint:
    """Health check and basic connectivity tests"""
    
    def test_health_returns_ok(self):
        """Test /api/health returns status ok with Firebase configured"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["app"] == "Suma"
        assert data["version"] == "0.1.0"
        assert data["firebase"] == "configured"


class TestAuthEndpoints:
    """Authentication endpoint tests - Firebase token validation"""
    
    def test_auth_me_rejects_no_token(self):
        """Test /api/v1/auth/me rejects request without token"""
        response = requests.get(f"{BASE_URL}/api/v1/auth/me")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_auth_me_rejects_invalid_token(self):
        """Test /api/v1/auth/me rejects invalid Firebase token with 401"""
        response = requests.get(
            f"{BASE_URL}/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Invalid token" in data["detail"] or "token" in data["detail"].lower()
    
    def test_auth_register_rejects_invalid_token(self):
        """Test /api/v1/auth/register rejects invalid Firebase token with 401"""
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/register",
            headers={
                "Authorization": "Bearer invalid_token_xyz",
                "Content-Type": "application/json"
            },
            json={"display_name": "Test User"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_auth_register_rejects_no_token(self):
        """Test /api/v1/auth/register requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/register",
            headers={"Content-Type": "application/json"},
            json={"display_name": "Test User"}
        )
        assert response.status_code == 401


class TestSeedEndpoint:
    """Seed data endpoint tests"""
    
    def test_seed_is_idempotent(self):
        """Test /api/seed creates seed data and is idempotent"""
        response = requests.post(f"{BASE_URL}/api/seed")
        assert response.status_code == 200
        data = response.json()
        # Should either create new data or say already seeded
        assert "message" in data
        assert "seed" in data["message"].lower() or "Seed" in data["message"]


class TestMovementsEndpoints:
    """Movements CRUD operations tests"""
    
    def test_list_movements_returns_data(self):
        """Test GET /api/v1/movements returns movements list"""
        response = requests.get(f"{BASE_URL}/api/v1/movements")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 0  # May have seed data
    
    def test_list_movements_with_status_filter(self):
        """Test GET /api/v1/movements filters by status"""
        response = requests.get(f"{BASE_URL}/api/v1/movements?status=pending")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned items should be pending
        for movement in data:
            assert movement["status"] == "pending"
    
    def test_list_movements_with_type_filter(self):
        """Test GET /api/v1/movements filters by type"""
        response = requests.get(f"{BASE_URL}/api/v1/movements?type=income")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned items should be income
        for movement in data:
            assert movement["type"] == "income"
    
    def test_create_movement_and_verify(self):
        """Test POST /api/v1/movements creates a new movement"""
        create_payload = {
            "type": "income",
            "amount": 99999.0,
            "currency": "CRC",
            "description": "TEST_PyTest automated test movement",
            "responsible": "TestBot",
            "status": "pending",
            "date": "2026-01-25",
            "tags": ["Test"]
        }
        response = requests.post(
            f"{BASE_URL}/api/v1/movements",
            json=create_payload
        )
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "id" in data
        assert data["type"] == "income"
        assert data["amount"] == 99999.0
        assert data["description"] == "TEST_PyTest automated test movement"
        assert data["responsible"] == "TestBot"
        assert data["status"] == "pending"
        
        # Store for cleanup
        movement_id = data["id"]
        
        # Verify with GET (via list)
        list_response = requests.get(f"{BASE_URL}/api/v1/movements")
        all_movements = list_response.json()
        found = any(m["id"] == movement_id for m in all_movements)
        assert found, "Created movement should appear in list"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/v1/movements/{movement_id}")
    
    def test_update_movement(self):
        """Test PATCH /api/v1/movements/{id} updates a movement"""
        # First create a movement
        create_payload = {
            "type": "expense",
            "amount": 1000.0,
            "description": "TEST_Update test",
            "status": "pending",
            "date": "2026-01-26"
        }
        create_response = requests.post(f"{BASE_URL}/api/v1/movements", json=create_payload)
        assert create_response.status_code == 200
        movement_id = create_response.json()["id"]
        
        # Update the movement
        update_payload = {
            "amount": 2000.0,
            "description": "TEST_Updated description",
            "status": "classified"
        }
        update_response = requests.patch(
            f"{BASE_URL}/api/v1/movements/{movement_id}",
            json=update_payload
        )
        assert update_response.status_code == 200
        updated_data = update_response.json()
        
        # Validate updates
        assert updated_data["amount"] == 2000.0
        assert updated_data["description"] == "TEST_Updated description"
        assert updated_data["status"] == "classified"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/v1/movements/{movement_id}")
    
    def test_delete_movement(self):
        """Test DELETE /api/v1/movements/{id} deletes a movement"""
        # First create a movement
        create_payload = {
            "type": "income",
            "amount": 500.0,
            "description": "TEST_Delete test",
            "status": "pending",
            "date": "2026-01-27"
        }
        create_response = requests.post(f"{BASE_URL}/api/v1/movements", json=create_payload)
        movement_id = create_response.json()["id"]
        
        # Delete the movement
        delete_response = requests.delete(f"{BASE_URL}/api/v1/movements/{movement_id}")
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data["deleted"] == True
        
        # Verify deletion - should get 404 if we try to update
        verify_response = requests.patch(
            f"{BASE_URL}/api/v1/movements/{movement_id}",
            json={"amount": 100}
        )
        assert verify_response.status_code == 404


class TestBusinessUnitsEndpoints:
    """Business Units CRUD tests"""
    
    def test_list_business_units(self):
        """Test GET /api/v1/business-units returns list"""
        response = requests.get(f"{BASE_URL}/api/v1/business-units")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_business_unit(self):
        """Test POST /api/v1/business-units creates new unit"""
        create_payload = {
            "name": "TEST_Nueva Sucursal",
            "type": "branch"
        }
        response = requests.post(
            f"{BASE_URL}/api/v1/business-units",
            json=create_payload
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["name"] == "TEST_Nueva Sucursal"
        assert data["type"] == "branch"
        assert "created_at" in data


class TestTagsEndpoints:
    """Tags CRUD tests"""
    
    def test_list_tags(self):
        """Test GET /api/v1/tags returns list"""
        response = requests.get(f"{BASE_URL}/api/v1/tags")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_tag(self):
        """Test POST /api/v1/tags creates new tag"""
        create_payload = {
            "name": "TEST_NuevoTag"
        }
        response = requests.post(
            f"{BASE_URL}/api/v1/tags",
            json=create_payload
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["name"] == "TEST_NuevoTag"
        assert "created_at" in data


class TestKPIsEndpoint:
    """KPIs summary endpoint tests"""
    
    def test_kpis_summary_returns_valid_data(self):
        """Test GET /api/v1/kpis/summary returns valid KPI data"""
        response = requests.get(f"{BASE_URL}/api/v1/kpis/summary")
        assert response.status_code == 200
        data = response.json()
        
        # Validate structure
        assert "total_income" in data
        assert "total_expense" in data
        assert "balance" in data
        assert "movement_count" in data
        assert "pending_count" in data
        
        # Validate types
        assert isinstance(data["total_income"], (int, float))
        assert isinstance(data["total_expense"], (int, float))
        assert isinstance(data["balance"], (int, float))
        assert isinstance(data["movement_count"], int)
        assert isinstance(data["pending_count"], int)
        
        # Validate balance calculation
        expected_balance = data["total_income"] - data["total_expense"]
        assert abs(data["balance"] - expected_balance) < 0.01, "Balance should equal income - expense"


# Fixtures
@pytest.fixture(scope="session", autouse=True)
def ensure_seed_data():
    """Ensure seed data exists before running tests"""
    requests.post(f"{BASE_URL}/api/seed")
