# Preload model weights during the build step rather than application startup so it avoids OOM on Render
import os
from sentence_transformers import SentenceTransformer

# Limit threads
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import torch
torch.set_num_threads(1)
torch.set_grad_enabled(False)

# Set Hugging Face home to cache inside application directory
os.environ["HF_HOME"] = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".huggingface_cache")

print("Downloading sentence-transformers/all-MiniLM-L6-v2 during build phase...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model download complete!")
