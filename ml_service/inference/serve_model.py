from flask import Flask, request, jsonify
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

app = Flask(__name__)

# Paths
base_model_id = "mistralai/Mistral-7B-Instruct-v0.2"
adapter_path = "../models/opengiv-ngo-assistant-v1"

print("Loading model...")
# Load base model
base_model = AutoModelForCausalLM.from_pretrained(
    base_model_id,
    torch_dtype=torch.float16,
    device_map="auto"
)

# Load adapter
model = PeftModel.from_pretrained(base_model, adapter_path)
tokenizer = AutoTokenizer.from_pretrained(base_model_id)

print("Model loaded successfully!")

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    prompt = data.get('prompt', '')
    
    messages = [
        {"role": "user", "content": prompt}
    ]
    
    encodeds = tokenizer.apply_chat_template(messages, return_tensors="pt")
    model_inputs = encodeds.to(model.device)
    
    generated_ids = model.generate(model_inputs, max_new_tokens=1000, do_sample=True)
    decoded = tokenizer.batch_decode(generated_ids)
    
    return jsonify({"response": decoded[0]})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
