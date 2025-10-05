import requests

def test_generate():
    response = requests.post('http://localhost:5000/generate', json={'user_input': 'Generate me a pythonic language with advanced stock market builtin functions for technical analysis.'})
    assert response.status_code == 200

    json = response.json()
    print(json)

if __name__ == '__main__':
    test_generate()