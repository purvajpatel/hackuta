# app/tests/test_download.py
import requests
import io
import zipfile

def test_download():
    response = requests.post('http://localhost:5000/download', json={})
    assert response.status_code == 200
    assert response.headers['Content-Type'] == 'application/zip'
    assert 'attachment' in response.headers.get('Content-Disposition', '')
    assert 'filename=forge.zip' in response.headers.get('Content-Disposition', '')
    
    with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
        names = set(zf.namelist())
        for filename in ['int.hpp', 'chisel.hpp', 'main.cpp']:
            assert filename in names
    
    print("✓ Download test passed - ZIP contains all expected files")

if __name__ == '__main__':
    test_download()