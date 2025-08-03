import requests
import json

# Test the production API with minimal data
API_BASE_URL = "https://www.farejai.shop"
API_SECRET_KEY = "Farejai-secure-2024-admin-Key*"
API_HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_SECRET_KEY}"
}

# Test with minimal required fields only
minimal_data = {
    "title": "Test Product",
    "price": 99.99,
    "storeName": "Amazon",
    "affiliateLink": "https://amazon.com.br/test"
}

print("Testing production API with minimal data...")
print(f"Data: {minimal_data}")

try:
    response = requests.post(
        f"{API_BASE_URL}/api/promotions",
        json=minimal_data,
        headers=API_HEADERS,
        timeout=30
    )
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Body: {response.text}")
    
except Exception as e:
    print(f"Exception occurred: {e}")

# Now test with the exact same data structure as your script
print("\n" + "="*50)
print("Testing with exact script data structure...")

script_data = {
    "title": "Barra Whey Protein Test",
    "price": 66.02,
    "price_from": 107.88,
    "storeName": "Mercado Livre",
    "affiliateLink": "https://mercadolivre.com/sec/test123",
    "coupon": "MELINACAZETV"
}

print(f"Data: {script_data}")

try:
    response = requests.post(
        f"{API_BASE_URL}/api/promotions",
        json=script_data,
        headers=API_HEADERS,
        timeout=30
    )
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Body: {response.text}")
    
except Exception as e:
    print(f"Exception occurred: {e}")

# Test with different storeName format
print("\n" + "="*50)
print("Testing with Amazon...")

amazon_data = {
    "title": "Test Amazon Product",
    "price": 66.02,
    "price_from": 107.88,
    "storeName": "Amazon",
    "affiliateLink": "https://amazon.com.br/test123",
    "coupon": "TESTCOUPON"
}

print(f"Data: {amazon_data}")

try:
    response = requests.post(
        f"{API_BASE_URL}/api/promotions",
        json=amazon_data,
        headers=API_HEADERS,
        timeout=30
    )
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Body: {response.text}")
    
except Exception as e:
    print(f"Exception occurred: {e}")