import requests

def test_run():
    response = requests.post('http://localhost:5000/run', json={'example': 'print("hello")'})
    assert response.status_code == 200
    print(response.json())

if __name__ == '__main__':
    test_run()