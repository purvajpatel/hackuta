import asyncio
import os
import subprocess

from flask import Flask, request, jsonify, send_file
from io import BytesIO
from zipfile import ZipFile, ZIP_DEFLATED
from lib.dedalus import main as dedalus_main
from dotenv import load_dotenv


load_dotenv()

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHISEL_DIR = os.path.dirname(os.path.join(PROJECT_ROOT, 'chisel'))

def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY=os.getenv('SECRET_KEY'),
        DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite'),
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass


    @app.route('/')
    def index():
        return send_file(os.path.join(PROJECT_ROOT, 'index.html'))

    @app.route('/style.css')
    def style():
        return send_file(os.path.join(PROJECT_ROOT, 'style.css'))

    @app.route('/script.js')
    def script():
        return send_file(os.path.join(PROJECT_ROOT, 'script.js'))

    @app.route('/generate', methods=['POST'])
    def generate():
        data = request.json
        description = data.get('user_input')
        obj_ret = asyncio.run(dedalus_main(description))
        return jsonify(obj_ret)

    @app.route('/run', methods=['POST'])
    def run():
        data = request.json
        example = data.get('example')
        with open(os.path.join(CHISEL_DIR, 'user_example.txt'), 'w') as f:
            f.write(example)

        output = subprocess.run(f"cd {CHISEL_DIR} && ./a.out {os.path.join(CHISEL_DIR, 'user_example.txt')}", capture_output=True, shell=True, text=True)
        print(output.stdout)
        return jsonify({'output': output.stdout})

    @app.route('/download', methods=['POST'])
    def download():
        data = request.json or {}
        filenames = ['int.hpp', 'chisel.hpp', 'main.cpp']

        memory_file = BytesIO()
        with ZipFile(memory_file, mode='w', compression=ZIP_DEFLATED) as zf:
            for name in filenames:
                path = os.path.join(CHISEL_DIR, name)  # adjust base dir as needed
                if os.path.isfile(path):
                    # arcname controls the file name inside the zip
                    zf.write(path, arcname=name)

        memory_file.seek(0)
        return send_file(
            memory_file,
            mimetype='application/zip',
            as_attachment=True,
            download_name='forge.zip'
        )


    return app
