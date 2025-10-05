import requests

def test_generate():
    response = requests.post('http://localhost:5000/generate', json={'user_input': 'Generate me a pythonic language with advanced stock market builtin functions for technical analysis.', 'bypass_gen': False})
    assert response.status_code == 200

    json = response.json()
    print(json['template'])
    print(json['example'])

if __name__ == '__main__':
    test_generate()