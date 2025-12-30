import requests

# ⚙️ CONFIGURATION
BASE_URL = "http://127.0.0.1:8000/api/v1"

def create_student():
    print("🚀 Creating Student User...")
    
    payload = {
        "email": "student@iqmath.com",
        "password": "pass123",  
        "name": "Test Student",
        "role": "student",
        "phone_number": "1122334455"
    }
    
    try:
        # 1. Attempt to create user
        response = requests.post(f"{BASE_URL}/users", json=payload)
        
        if response.status_code == 201:
            print("✅ SUCCESS! Student created.")
            print("📧 Email: student@iqmath.com")
            print("🔑 Password: pass123")
        elif response.status_code == 400:
            print("⚠️ User already exists. You can login with these credentials.")
        else:
            print(f"❌ Failed to create user: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"🔥 Error: {e}")
        print("Is the backend server running?")

if __name__ == "__main__":
    create_student()