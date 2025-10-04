import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

prompt_txt = open(os.path.join(os.path.dirname(__file__), 'example_prompt.txt')).read()

client = OpenAI(
    api_key=os.getenv('GEMINI_API_KEY'),
    base_url=os.getenv('GEMINI_API_BASE', "https://generativelanguage.googleapis.com/v1beta/openai/")
)


def generate_program(description):
    response = client.chat.completions.create(
        model="gemini-2.5-pro",

        messages=[
            {"role": "system", "content": "You are a helpful assistant that generates domain-specific programming languages from natural language descriptions." + prompt_txt},
            {"role": "user", "content": description}],
    )
    return response.choices[0].message.content


if __name__ == "__main__":
    print(generate_program("Generate me a pythonic language with advanced stock market builtin functions for technical analysis."))