import os
from flask import Flask, render_template, request, jsonify, send_file
from dotenv import load_dotenv

from lib.generator import generate_program


load_dotenv()
app = Flask(__name__)

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


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

    # save on gemini key usage
    bypass_gen = data.get('bypass_gen', False)
    if not bypass_gen:
        program = generate_program(description)
    else:
        program = open(os.path.join(PROJECT_ROOT, 'app', 'lib', 'generate_output.txt')).read()

    #split the code blocks into two
    program = program.split('```')
    template = program[1]
    example = program[3]

    return jsonify({'template': template, 'example': example})

@app.route('/generate_inthpp', methods=['POST'])
def generate_inthpp():
    data = request.json
    chisel = data.get('chisel')
    inthpp = generate_inthpp(chisel)
    return jsonify({'inthpp': inthpp})



if __name__ == '__main__':
    app.run(debug=True)