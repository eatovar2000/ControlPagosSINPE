"""
FASE 7.1 Backend API Tests
Tests for:
- Health check endpoint
- Auth protection on movements
- PATCH status changes (pending, classified, closed)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    raise RuntimeError("REACT_APP_BACKEND_URL environment variable must be set")

BASE_URL = BASE_URL.rstrip('/')


class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_returns_200(self):
        """GET /api/health returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["app"] == "Suma"
        assert data["firebase"] == "configured"


class TestAuthProtection:
    """Verify endpoints require authentication"""
    
    def test_movements_returns_401_without_token(self):
        """GET /api/v1/movements returns 401 without token"""
        response = requests.get(f"{BASE_URL}/api/v1/movements")
        assert response.status_code == 401
    
    def test_movements_with_status_filter_returns_401(self):
        """GET /api/v1/movements?status=pending returns 401 without token"""
        response = requests.get(f"{BASE_URL}/api/v1/movements?status=pending")
        assert response.status_code == 401
    
    def test_kpis_returns_401_without_token(self):
        """GET /api/v1/kpis/summary returns 401 without token"""
        response = requests.get(f"{BASE_URL}/api/v1/kpis/summary")
        assert response.status_code == 401


class TestPatchMovementStatus:
    """PATCH /api/v1/movements/{id} status change tests"""
    
    def test_patch_classified_requires_auth(self):
        """PATCH with status='classified' requires auth"""
        response = requests.patch(
            f"{BASE_URL}/api/v1/movements/test-id",
            json={"status": "classified"}
        )
        assert response.status_code == 401
    
    def test_patch_closed_requires_auth(self):
        """PATCH with status='closed' requires auth"""
        response = requests.patch(
            f"{BASE_URL}/api/v1/movements/test-id",
            json={"status": "closed"}
        )
        assert response.status_code == 401
    
    def test_patch_pending_requires_auth(self):
        """PATCH with status='pending' (reopen) requires auth"""
        response = requests.patch(
            f"{BASE_URL}/api/v1/movements/test-id",
            json={"status": "pending"}
        )
        assert response.status_code == 401
    
    def test_patch_with_responsible_requires_auth(self):
        """PATCH with responsible field requires auth"""
        response = requests.patch(
            f"{BASE_URL}/api/v1/movements/test-id",
            json={"responsible": "Juan Perez"}
        )
        assert response.status_code == 401


class TestPublicEndpoints:
    """Verify public endpoints work without auth"""
    
    def test_business_units_public(self):
        """GET /api/v1/business-units is public"""
        response = requests.get(f"{BASE_URL}/api/v1/business-units")
        assert response.status_code == 200
    
    def test_tags_public(self):
        """GET /api/v1/tags is public"""
        response = requests.get(f"{BASE_URL}/api/v1/tags")
        assert response.status_code == 200
