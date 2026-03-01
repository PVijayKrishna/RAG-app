import os
import chromadb
from dotenv import load_dotenv

# Load environment variables (useful if using the CloudClient from your project)
load_dotenv()

def view_chroma_contents():
    # 1. Initialization based on your project's actual code (main.py uses CloudClient)
    CHROMA_TENANT = os.getenv("CHROMA_TENANT", "").strip()
    CHROMA_DATABASE = os.getenv("CHROMA_DATABASE", "").strip()
    CHROMA_API_KEY = os.getenv("CHROMA_API_KEY", "").strip()

    try:
        if CHROMA_TENANT and CHROMA_DATABASE and CHROMA_API_KEY:
            print("Connecting to Chroma Cloud Database (as per main.py)...")
            client = chromadb.CloudClient(
                tenant=CHROMA_TENANT,
                database=CHROMA_DATABASE,
                api_key=CHROMA_API_KEY
            )
            # Your project uses this collection name:
            collection = client.get_collection(name="rag_collection_v2")
        else:
            # 2. Initialization based on your assumption (Local Persistent Storage)
            print("Connecting to local Persistent Chroma DB ('chroma_db')...")
            client = chromadb.PersistentClient(path="chroma_db")
            # Using the default collection name as specified in your assumption
            collection = client.get_collection(name="default")

        # Fetch all documents, metadata, and IDs
        # Calling get() without arguments fetches all records
        results = collection.get(
            include=["documents", "metadatas"]
        )

        ids = results.get("ids", [])
        documents = results.get("documents", [])
        metadatas = results.get("metadatas", [])

        print(f"\nTotal documents found: {len(ids)}\n")

        for i in range(len(ids)):
            print(f"{"="*40}")
            print(f"Document {i+1} of {len(ids)}")
            print(f"{"="*40}")
            print(f"ID:       {ids[i]}")
            print(f"Metadata: {metadatas[i]}")
            print(f"Document: \n{documents[i]}\n")
            
    except Exception as e:
        print(f"Error accessing Chroma database: {e}")

if __name__ == "__main__":
    view_chroma_contents()
