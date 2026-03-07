# Preload the lightweight ONNX embedding model during the build step
# This uses ChromaDB's default embedding function (onnxruntime-based)
# which is much lighter than PyTorch + SentenceTransformers

import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from chromadb.utils import embedding_functions

print("Pre-loading ChromaDB default embedding function (ONNX-based)...")
ef = embedding_functions.DefaultEmbeddingFunction()
# Generate a test embedding to trigger model download/cache
test_result = ef(["test sentence for model warmup"])
print(f"Model loaded successfully! Test embedding dimension: {len(test_result[0])}")
