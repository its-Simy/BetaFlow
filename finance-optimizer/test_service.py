"""
Test script for Finance Optimizer Service
"""

import requests
import json

BASE_URL = "http://localhost:5004"

def test_health():
    """Test health check endpoint"""
    print("\n1. Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_analyze_risk():
    """Test risk analysis endpoint"""
    print("\n2. Testing risk analysis...")
    
    # Sample portfolio data
    payload = {
        "holdings": [
            {
                "symbol": "AAPL",
                "shares": 10,
                "value": 1700.00,
                "sector": "Technology"
            },
            {
                "symbol": "MSFT",
                "shares": 5,
                "value": 1500.00,
                "sector": "Technology"
            },
            {
                "symbol": "JPM",
                "shares": 8,
                "value": 1200.00,
                "sector": "Financial"
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/analyze-risk",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\nRisk Analysis Results:")
        print(f"  Beta: {result.get('beta')}")
        print(f"  Volatility: {result.get('volatility')}%")
        print(f"  Sharpe Ratio: {result.get('sharpe_ratio')}")
        print(f"  Max Drawdown: {result.get('max_drawdown')}%")
        print(f"  VaR (95%): {result.get('var_95')}%")
        print(f"  Diversification Score: {result.get('diversification_score')}")
        print(f"  Number of Holdings: {result.get('num_holdings')}")
        print(f"  Total Value: ${result.get('total_value')}")
        print(f"  Cached: {result.get('cached')}")
    else:
        print(f"Error: {response.json()}")
    
    return response.status_code == 200

def test_invalid_request():
    """Test with invalid request"""
    print("\n3. Testing invalid request...")
    
    response = requests.post(
        f"{BASE_URL}/analyze-risk",
        json={},
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 400

if __name__ == "__main__":
    print("=" * 60)
    print("Finance Optimizer Service - Test Suite")
    print("=" * 60)
    print(f"\nBase URL: {BASE_URL}")
    print("\nMake sure the service is running: python3 run.py")
    print("\nStarting tests...")
    
    try:
        results = []
        results.append(("Health Check", test_health()))
        results.append(("Risk Analysis", test_analyze_risk()))
        results.append(("Invalid Request", test_invalid_request()))
        
        print("\n" + "=" * 60)
        print("Test Results:")
        print("=" * 60)
        
        for test_name, passed in results:
            status = "✅ PASSED" if passed else "❌ FAILED"
            print(f"{test_name}: {status}")
        
        all_passed = all([result[1] for result in results])
        if all_passed:
            print("\n✅ All tests passed!")
        else:
            print("\n❌ Some tests failed")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to service")
        print("Make sure the service is running: python3 run.py")

