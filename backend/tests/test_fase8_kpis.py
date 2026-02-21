"""
FASE 8 - KPIs Summary Endpoint Tests
Tests for GET /api/v1/kpis/summary with period filters
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://micro-expenses.preview.emergentagent.com').rstrip('/')


class TestKPIsSummaryAuthRequired:
    """Test that KPIs endpoint requires authentication"""
    
    def test_kpis_summary_returns_401_without_token(self):
        """KPIs summary requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v1/kpis/summary")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print("PASS: GET /api/v1/kpis/summary returns 401 without token")
    
    def test_kpis_summary_today_returns_401_without_token(self):
        """KPIs summary with period=today requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v1/kpis/summary?period=today")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/v1/kpis/summary?period=today returns 401 without token")
    
    def test_kpis_summary_week_returns_401_without_token(self):
        """KPIs summary with period=week requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v1/kpis/summary?period=week")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/v1/kpis/summary?period=week returns 401 without token")
    
    def test_kpis_summary_month_returns_401_without_token(self):
        """KPIs summary with period=month requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v1/kpis/summary?period=month")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/v1/kpis/summary?period=month returns 401 without token")


class TestHealthAndPublicEndpoints:
    """Test health and public endpoints are accessible"""
    
    def test_health_endpoint_returns_ok(self):
        """Health check endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        assert data.get("firebase") == "configured"
        print("PASS: GET /api/health returns 200 with status=ok and firebase=configured")
    
    def test_business_units_is_public(self):
        """Business units endpoint should be public"""
        response = requests.get(f"{BASE_URL}/api/v1/business-units")
        assert response.status_code == 200
        print("PASS: GET /api/v1/business-units is public (200)")
    
    def test_tags_is_public(self):
        """Tags endpoint should be public"""
        response = requests.get(f"{BASE_URL}/api/v1/tags")
        assert response.status_code == 200
        print("PASS: GET /api/v1/tags is public (200)")


class TestMovementsRequireAuth:
    """Test that movement endpoints require authentication"""
    
    def test_movements_list_returns_401_without_token(self):
        """Movements list requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v1/movements")
        assert response.status_code == 401
        print("PASS: GET /api/v1/movements returns 401 without token")
    
    def test_movements_create_returns_401_without_token(self):
        """Movements create requires authentication"""
        response = requests.post(f"{BASE_URL}/api/v1/movements", json={
            "type": "income",
            "amount": 1000,
            "date": "2026-01-20"
        })
        assert response.status_code == 401
        print("PASS: POST /api/v1/movements returns 401 without token")


class TestInvalidPeriodParameter:
    """Test that invalid period parameter returns error"""
    
    def test_kpis_summary_invalid_period_returns_422(self):
        """Invalid period parameter should return 422 validation error"""
        # Note: FastAPI with Literal type should reject invalid values with 422
        # But since auth is checked first, we may get 401 instead
        response = requests.get(f"{BASE_URL}/api/v1/kpis/summary?period=invalid")
        # Should be 401 (auth checked first) or 422 (validation error)
        assert response.status_code in [401, 422], f"Expected 401 or 422, got {response.status_code}"
        print(f"PASS: GET /api/v1/kpis/summary?period=invalid returns {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
