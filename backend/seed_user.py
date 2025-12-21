import requests

# API URL
url = "http://127.0.0.1:8000/api/v1/users"

def create_account(email, password, name, role):
    payload = {
        "email": email,
        "password": password,
        "name": name,
        "role": role
    }
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 201:
            print(f"✅ SUCCESS: {role.capitalize()} created! ({email})")
        elif response.status_code == 400:
            print(f"⚠️  {role.capitalize()} already exists.")
        else:
            print(f"❌ Failed to create {role}: {response.status_code}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

# 1. Create Instructor
create_account("instructor@iqmath.com", "password123", "Head Instructor", "instructor")

# 2. Create Student
create_account("student@iqmath.com", "password123", "Student One", "student")