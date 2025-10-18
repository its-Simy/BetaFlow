#!/usr/bin/env python3
"""
Test script for the Stock Service
Tests all endpoints to ensure they work correctly
"""

import requests
import json
import time

BASE_URL = "http://localhost:5002"

def test_health():
    """Test health check endpoint"""
    print("Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_search_stock():
    """Test stock search endpoint"""
    print("\nTesting stock search...")
    try:
        response = requests.get(f"{BASE_URL}/stocks/search?q=AAPL")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Symbol: {data.get('symbol')}")
        print(f"Name: {data.get('name')}")
        print(f"Price: ${data.get('current_price')}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_stock_details():
    """Test stock details endpoint"""
    print("\nTesting stock details...")
    try:
        response = requests.get(f"{BASE_URL}/stocks/AAPL")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Symbol: {data.get('symbol')}")
        print(f"Name: {data.get('name')}")
        print(f"Price: ${data.get('current_price')}")
        print(f"Sector: {data.get('sector')}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_stock_history():
    """Test stock history endpoint"""
    print("\nTesting stock history...")
    try:
        response = requests.get(f"{BASE_URL}/stocks/AAPL/history?period=1mo&interval=1d")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Symbol: {data.get('symbol')}")
        print(f"Data points: {len(data.get('data', []))}")
        if data.get('data'):
            print(f"First date: {data['data'][0]['date']}")
            print(f"Last date: {data['data'][-1]['date']}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_stock_quote():
    """Test stock quote endpoint"""
    print("\nTesting stock quote...")
    try:
        response = requests.get(f"{BASE_URL}/stocks/AAPL/quote")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Symbol: {data.get('symbol')}")
        print(f"Price: ${data.get('current_price')}")
        print(f"Change: ${data.get('change')}")
        print(f"Change %: {data.get('change_percent')}%")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_batch_stocks():
    """Test batch stocks endpoint"""
    print("\nTesting batch stocks...")
    try:
        payload = {"symbols": ["AAPL", "GOOGL", "MSFT", "TSLA"]}
        response = requests.post(f"{BASE_URL}/stocks/batch", json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Results: {len(data.get('results', []))}")
        for result in data.get('results', []):
            if 'error' not in result:
                print(f"  {result['symbol']}: ${result['current_price']} ({result['change_percent']:.2f}%)")
            else:
                print(f"  {result['symbol']}: Error - {result['error']}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 50)
    print("STOCK SERVICE TEST SUITE")
    print("=" * 50)
    
    tests = [
        test_health,
        test_search_stock,
        test_stock_details,
        test_stock_history,
        test_stock_quote,
        test_batch_stocks
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        time.sleep(1)  # Small delay between tests
    
    print("\n" + "=" * 50)
    print(f"RESULTS: {passed}/{total} tests passed")
    print("=" * 50)
    
    if passed == total:
        print("✅ All tests passed! Stock service is working correctly.")
    else:
        print("❌ Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()
