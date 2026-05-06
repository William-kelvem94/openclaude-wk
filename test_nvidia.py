from openai import OpenAI
import time

client = OpenAI(
    base_url = "https://integrate.api.nvidia.com/v1",
    api_key = "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"
)

print("⏱️ Iniciando chamada...")
start = time.time()

completion = client.chat.completions.create(
    model="google/gemma-4-31b-it",
    messages=[{"role":"user","content":"Digá 'Funcionou!' em menos de 10 palavras"}],
    temperature=0.2,
    max_tokens=100,
    stream=True
)

for chunk in completion:
    if chunk.choices and chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")

end = time.time()
print(f"\n\n✅ Tempo total: {end - start:.2f} segundos")
