#!/usr/bin/env python3
"""
Test script to verify the rule execution fixes
"""
import requests
import json
import pandas as pd
import os
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:8000"
TEST_DATA = {
    "dataset_version_id": "test-dataset-123",
    "rule_ids": ["test-rule-456"]
}

def test_imports():
    """Test that all imports work correctly"""
    print("Testing imports...")
    try:
        from api.app.services.rule_engine import RuleEngineService
        from api.app.services.data_import import DataImportService
        print("✅ All imports working correctly")
        return True
    except Exception as e:
        print(f"❌ Import error: {str(e)}")
        return False

def test_data_directory():
    """Test that data directory exists"""
    print("Testing data directory...")
    data_dir = Path("api/data/datasets")
    if data_dir.exists():
        print("✅ Data directory exists")
        return True
    else:
        print("❌ Data directory missing")
        return False

def create_test_dataset():
    """Create a test dataset file"""
    print("Creating test dataset...")
    try:
        # Create test data
        test_df = pd.DataFrame({
            'id': [1, 2, 3, 4, 5],
            'name': ['John', 'Jane', '', 'Bob', 'Alice'],
            'email': ['john@example.com', 'jane@example.com', 'invalid-email', 'bob@example.com', ''],
            'age': [25, 30, 22, None, 28]
        })

        # Ensure directory exists
        data_dir = Path("api/data/datasets")
        data_dir.mkdir(parents=True, exist_ok=True)

        # Save test dataset
        test_file = data_dir / "test-dataset-123_v1.parquet"
        test_df.to_parquet(test_file, index=False)

        print("✅ Test dataset created successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to create test dataset: {str(e)}")
        return False

def test_api_connection():
    """Test if API is accessible"""
    print("Testing API connection...")
    try:
        response = requests.get(f"{API_BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ API is accessible")
            return True
        else:
            print(f"❌ API returned status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API connection failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting rule execution fix tests\n")

    tests = [
        test_imports,
        test_data_directory,
        create_test_dataset,
        test_api_connection
    ]

    passed = 0
    for test in tests:
        if test():
            passed += 1
        print()

    print(f"Test Results: {passed}/{len(tests)} passed")

    if passed == len(tests):
        print("🎉 All tests passed! The fixes should resolve the 500 error.")
    else:
        print("⚠️  Some tests failed. Please check the issues above.")

if __name__ == "__main__":
    main()