# OpenGiv AI Service

This directory contains the machine learning components for the OpenGiv platform. We have fine-tuned a Mistral-7B model using LoRA (Low-Rank Adaptation) on a custom dataset of NGO-related interactions to provide context-aware assistance to our users.

## Structure

- `dataset/`: Contains the training data (`ngo_conversations.jsonl`) used for fine-tuning.
- `training/`: Scripts for training the model (`train_lora.py`).
- `models/`: Stores the fine-tuned adapter configurations and weights.
- `inference/`: Python service (`serve_model.py`) to expose the model via a REST API.

## Training

To reproduce the training process:

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the training script:
   ```bash
   python training/train_lora.py
   ```

## Inference

To start the inference server:

```bash
python inference/serve_model.py
```

The service will be available at `http://localhost:5001`.
