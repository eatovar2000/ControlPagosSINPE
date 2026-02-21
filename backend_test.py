#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class SumaAPITester:
    def __init__(self, base_url="https://modular-backend-pwa.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, check_response=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            # Additional response validation if provided
            if success and check_response:
                success = check_response(response_data)

            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                if response_data:
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")
                self.failed_tests.append(name)

            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response": response_data
            })

            return success, response_data

        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            self.failed_tests.append(name)
            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "success": False,
                "error": str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "health",
            200,
            check_response=lambda r: r.get("status") == "ok"
        )

    def test_seed_endpoint(self):
        """Test seed endpoint - should be idempotent"""
        print("\n🌱 Testing Seed Endpoint Idempotency...")
        
        # First call - should create data
        success1, response1 = self.run_test(
            "Seed Data (First Call)",
            "POST",
            "seed",
            200
        )
        
        # Second call - should return existing count
        success2, response2 = self.run_test(
            "Seed Data (Second Call - Idempotent)",
            "POST",
            "seed",
            200,
            check_response=lambda r: "already seeded" in r.get("message", "").lower() or r.get("movement_count", 0) > 0
        )
        
        return success1 and success2

    def test_movements_crud(self):
        """Test complete CRUD operations for movements"""
        print("\n📊 Testing Movements CRUD Operations...")
        
        # 1. Get all movements
        success_all, all_movements = self.run_test(
            "Get All Movements",
            "GET",
            "v1/movements",
            200,
            check_response=lambda r: isinstance(r, list)
        )
        
        # 2. Get pending movements (should be 3)
        success_pending, pending_movements = self.run_test(
            "Get Pending Movements",
            "GET",
            "v1/movements?status=pending",
            200,
            check_response=lambda r: isinstance(r, list) and len(r) == 3
        )
        
        # 3. Create new movement
        new_movement_data = {
            "type": "income",
            "amount": 50000,
            "currency": "CRC",
            "description": "Test movement from API",
            "responsible": "Test User",
            "status": "pending",
            "date": "2026-01-22",
            "tags": ["Test"]
        }
        
        success_create, created_movement = self.run_test(
            "Create New Movement",
            "POST",
            "v1/movements",
            200,
            data=new_movement_data,
            check_response=lambda r: r.get("id") is not None and r.get("type") == "income"
        )
        
        movement_id = created_movement.get("id") if success_create else None
        
        # 4. Update movement (if created successfully)
        success_update = False
        if movement_id:
            update_data = {
                "description": "Updated test movement",
                "status": "classified"
            }
            success_update, updated_movement = self.run_test(
                "Update Movement",
                "PATCH",
                f"v1/movements/{movement_id}",
                200,
                data=update_data,
                check_response=lambda r: r.get("description") == "Updated test movement"
            )
        
        # 5. Delete movement (if created successfully)  
        success_delete = False
        if movement_id:
            success_delete, delete_response = self.run_test(
                "Delete Movement",
                "DELETE",
                f"v1/movements/{movement_id}",
                200,
                check_response=lambda r: r.get("deleted") == True
            )
        
        return success_all and success_pending and success_create and success_update and success_delete

    def test_business_units(self):
        """Test business units endpoints"""
        print("\n🏢 Testing Business Units...")
        
        # Get business units (should be 2)
        success_get, units = self.run_test(
            "Get Business Units",
            "GET",
            "v1/business-units",
            200,
            check_response=lambda r: isinstance(r, list) and len(r) == 2
        )
        
        # Create new business unit
        new_unit_data = {
            "name": "Test Unit",
            "type": "branch"
        }
        
        success_create, created_unit = self.run_test(
            "Create Business Unit",
            "POST",
            "v1/business-units",
            200,
            data=new_unit_data,
            check_response=lambda r: r.get("name") == "Test Unit"
        )
        
        return success_get and success_create

    def test_tags(self):
        """Test tags endpoints"""
        print("\n🏷️ Testing Tags...")
        
        # Get tags (should be 3)
        success_get, tags = self.run_test(
            "Get Tags",
            "GET",
            "v1/tags",
            200,
            check_response=lambda r: isinstance(r, list) and len(r) == 3
        )
        
        # Create new tag
        new_tag_data = {
            "name": "Test Tag"
        }
        
        success_create, created_tag = self.run_test(
            "Create Tag",
            "POST",
            "v1/tags",
            200,
            data=new_tag_data,
            check_response=lambda r: r.get("name") == "Test Tag"
        )
        
        return success_get and success_create

    def test_kpis(self):
        """Test KPIs summary endpoint"""
        print("\n📈 Testing KPIs Summary...")
        
        return self.run_test(
            "Get KPIs Summary",
            "GET",
            "v1/kpis/summary",
            200,
            check_response=lambda r: all(key in r for key in ["total_income", "total_expense", "balance", "movement_count", "pending_count"])
        )[0]

def main():
    print("🚀 Starting Suma API Tests...")
    print("=" * 60)
    
    # Setup
    tester = SumaAPITester()
    
    # Run tests in logical order
    tests = [
        tester.test_health_check,
        tester.test_seed_endpoint,
        tester.test_movements_crud,
        tester.test_business_units,
        tester.test_tags,
        tester.test_kpis,
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test suite error: {str(e)}")
            tester.failed_tests.append(f"Test suite error: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {len(tester.failed_tests)}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0.0%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed tests:")
        for test in tester.failed_tests:
            print(f"   - {test}")
    
    # Save detailed results
    with open("/tmp/suma_api_test_results.json", "w") as f:
        json.dump({
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
                "failed_tests": tester.failed_tests
            },
            "detailed_results": tester.test_results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /tmp/suma_api_test_results.json")
    
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())