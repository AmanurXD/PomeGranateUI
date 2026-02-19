/**
 * Notebook cell snippets for connecting a remote LLM via Cloudflare Tunnel.
 *
 * Uses a custom FastAPI server with the exact same Llama() loading code
 * the user already has working (split_mode, tensor_split, etc.).
 * The `python -m llama_cpp.server` CLI doesn't properly support all GPU
 * options, so we write a small server.py that uses the Llama API directly.
 */

export interface NotebookCells {
    kaggleCell: string;
    colabCell: string;
}

/**
 * Generate a Kaggle notebook cell.
 */
export function generateKaggleCell(): string {
    // Using chr(10) for newlines inside the server script to avoid
    // multi-level backslash escaping nightmares (TS template → Python string → server.py source)
    return `# ===== PomeGranate Remote LLM (Kaggle) =====
# Run this cell with GPU accelerator enabled
# After it finishes, copy the URL and paste it into PomeGranate Settings

import subprocess, os, sys, time, re, threading

LLM_PORT = 8080
WORK_DIR = "/kaggle/working"
SERVER_LOG = os.path.join(WORK_DIR, "server.log")

# ─── Customize your model ───
REPO_ID = "bartowski/Qwen2.5-Coder-14B-Instruct-abliterated-GGUF"
FILENAME = "Qwen2.5-Coder-14B-Instruct-abliterated-Q8_0.gguf"
MODEL_DIR = os.path.join(WORK_DIR, "models")
CONTEXT_SIZE = 32768

# ==== Step 1: Install packages ====
print("📦 Installing llama-cpp-python with CUDA...")
subprocess.check_call([
    sys.executable, "-m", "pip", "install", "-q",
    "llama-cpp-python",
    "--extra-index-url", "https://abetlen.github.io/llama-cpp-python/whl/cu121",
    "--force-reinstall", "--no-cache-dir"
])
subprocess.check_call([sys.executable, "-m", "pip", "install", "-q",
    "huggingface_hub", "fastapi", "uvicorn"])
print("✅ Python packages installed")

# Install cloudflared
!wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /usr/local/bin/cloudflared
!chmod +x /usr/local/bin/cloudflared
print("✅ Cloudflare tunnel installed")

# ==== Step 2: Download model ====
from huggingface_hub import hf_hub_download
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_PATH = os.path.join(MODEL_DIR, FILENAME)
if not os.path.exists(MODEL_PATH):
    print(f"📥 Downloading {FILENAME} (may take a few minutes)...")
    hf_hub_download(repo_id=REPO_ID, filename=FILENAME, local_dir=MODEL_DIR)
print(f"✅ Model ready: {FILENAME}")

# ==== Step 3: Write custom server script ====
# Uses the EXACT same Llama() loading as your working Kaggle setup
# (python -m llama_cpp.server CLI doesn't support all GPU options)
NL = chr(10)
server_py = NL.join([
    "import json, sys",
    "from llama_cpp import Llama",
    "from fastapi import FastAPI, Request",
    "from fastapi.responses import StreamingResponse, JSONResponse",
    "import uvicorn",
    "",
    "print('Loading model...')",
    f"llm = Llama(",
    f'    model_path="{MODEL_PATH}",',
    f"    n_gpu_layers=-1,",
    f"    n_ctx={CONTEXT_SIZE},",
    f"    main_gpu=0,",
    f"    split_mode=1,",
    f"    tensor_split=[1, 1],",
    f"    n_batch=512,",
    f"    verbose=False,",
    f")",
    "print('Model loaded!')",
    "",
    "app = FastAPI()",
    "",
    '@app.get("/v1/models")',
    "def models():",
    '    return {"data": [{"id": "local-model", "object": "model"}]}',
    "",
    '@app.get("/health")',
    "def health():",
    '    return {"status": "ok"}',
    "",
    '@app.post("/v1/chat/completions")',
    "async def chat(request: Request):",
    "    body = await request.json()",
    '    messages = body.get("messages", [])',
    '    stream = body.get("stream", False)',
    '    temperature = body.get("temperature", 0.7)',
    '    max_tokens = body.get("max_tokens", 4096)',
    "    if stream:",
    "        def generate():",
    "            for chunk in llm.create_chat_completion(",
    "                messages=messages, stream=True,",
    "                temperature=temperature, max_tokens=max_tokens,",
    "            ):",
    '                yield "data: " + json.dumps(chunk) + chr(10) + chr(10)',
    '            yield "data: [DONE]" + chr(10) + chr(10)',
    '        return StreamingResponse(generate(), media_type="text/event-stream")',
    "    result = llm.create_chat_completion(",
    "        messages=messages, temperature=temperature, max_tokens=max_tokens,",
    "    )",
    "    return JSONResponse(content=result)",
    "",
    f'uvicorn.run(app, host="0.0.0.0", port={LLM_PORT})',
])

server_path = os.path.join(WORK_DIR, "server.py")
with open(server_path, "w") as f:
    f.write(server_py)
print("✅ Server script written")

# ==== Step 4: Start server ====
print(f"🚀 Starting LLM server on port {LLM_PORT}...")
log_file = open(SERVER_LOG, "w")
server_proc = subprocess.Popen(
    [sys.executable, server_path],
    stdout=log_file,
    stderr=subprocess.STDOUT,
    start_new_session=True,
)

# Wait for server — check health + detect crashes
import urllib.request
server_ready = False
print("⏳ Loading model into GPU (this takes 1-3 minutes for 14B)...")
for i in range(150):
    if server_proc.poll() is not None:
        print(f"\\n❌ Server exited with code {server_proc.returncode}")
        with open(SERVER_LOG) as f:
            print(f.read()[-3000:])
        break
    time.sleep(2)
    try:
        urllib.request.urlopen(f"http://localhost:{LLM_PORT}/v1/models", timeout=3)
        server_ready = True
        print(f"\\n✅ Server is ready! (took ~{i*2}s)")
        break
    except:
        if i % 15 == 0 and i > 0:
            print(f"   Still loading... ({i*2}s)")

if not server_ready and server_proc.poll() is None:
    print("\\n⚠️ Server still loading after 5 min — continuing anyway")

# ==== Step 5: Start tunnel ====
print("🔗 Creating public tunnel...")
tunnel_url = None

def capture_url(proc):
    global tunnel_url
    try:
        for line in iter(proc.stderr.readline, b""):
            text = line.decode().strip()
            m = re.search(r"https://[a-zA-Z0-9-]+\\.trycloudflare\\.com", text)
            if m:
                tunnel_url = m.group(0)
                break
    except:
        pass

tunnel_proc = subprocess.Popen(
    ["cloudflared", "tunnel", "--url", f"http://localhost:{LLM_PORT}", "--no-autoupdate"],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.PIPE,
    start_new_session=True,
)

reader = threading.Thread(target=capture_url, args=(tunnel_proc,))
reader.daemon = True
reader.start()
reader.join(timeout=30)

print()
print("=" * 60)
if tunnel_url:
    print("✅ ALL READY!")
    print()
    print(f"📋 YOUR TUNNEL URL (copy this):")
    print(f"   {tunnel_url}")
    print()
    print("👉 Paste this URL in PomeGranate Settings → Connect")
else:
    print("⚠️ Could not capture tunnel URL.")
    print("   Tunnel may still be starting.")
print("=" * 60)
print()
print("💡 Server & tunnel run in the background.")
print(f"   Server log: {SERVER_LOG}")

try:
    while True:
        time.sleep(60)
except KeyboardInterrupt:
    print()
    print("⚠️ Cell stopped — server & tunnel keep running!")
    if tunnel_url:
        print(f"📋 Tunnel URL: {tunnel_url}")
`;
}

/**
 * Generate a Google Colab notebook cell.
 */
export function generateColabCell(): string {
    return `# ===== PomeGranate Remote LLM (Colab) =====
# Run this cell with GPU runtime
# After it finishes, copy the URL and paste it into PomeGranate Settings

import subprocess, os, sys, time, re, threading

LLM_PORT = 8080
WORK_DIR = "/content"
SERVER_LOG = os.path.join(WORK_DIR, "server.log")

# ─── Customize your model ───
REPO_ID = "bartowski/Qwen2.5-Coder-14B-Instruct-abliterated-GGUF"
FILENAME = "Qwen2.5-Coder-14B-Instruct-abliterated-Q8_0.gguf"
MODEL_DIR = os.path.join(WORK_DIR, "models")
CONTEXT_SIZE = 8192

# ==== Step 1: Install packages ====
print("📦 Installing llama-cpp-python with CUDA...")
subprocess.check_call([
    sys.executable, "-m", "pip", "install", "-q",
    "llama-cpp-python",
    "--extra-index-url", "https://abetlen.github.io/llama-cpp-python/whl/cu121",
    "--force-reinstall", "--no-cache-dir"
])
subprocess.check_call([sys.executable, "-m", "pip", "install", "-q",
    "huggingface_hub", "fastapi", "uvicorn"])
print("✅ Python packages installed")

!wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /usr/local/bin/cloudflared
!chmod +x /usr/local/bin/cloudflared
print("✅ Cloudflare tunnel installed")

# ==== Step 2: Download model ====
from huggingface_hub import hf_hub_download
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_PATH = os.path.join(MODEL_DIR, FILENAME)
if not os.path.exists(MODEL_PATH):
    print(f"📥 Downloading {FILENAME}...")
    hf_hub_download(repo_id=REPO_ID, filename=FILENAME, local_dir=MODEL_DIR)
print(f"✅ Model ready: {FILENAME}")

# ==== Step 3: Write server script ====
NL = chr(10)
server_py = NL.join([
    "import json",
    "from llama_cpp import Llama",
    "from fastapi import FastAPI, Request",
    "from fastapi.responses import StreamingResponse, JSONResponse",
    "import uvicorn",
    "",
    "print('Loading model...')",
    f"llm = Llama(",
    f'    model_path="{MODEL_PATH}",',
    f"    n_gpu_layers=-1,",
    f"    n_ctx={CONTEXT_SIZE},",
    f"    n_batch=512,",
    f"    verbose=False,",
    f")",
    "print('Model loaded!')",
    "",
    "app = FastAPI()",
    "",
    '@app.get("/v1/models")',
    "def models():",
    '    return {"data": [{"id": "local-model", "object": "model"}]}',
    "",
    '@app.get("/health")',
    "def health():",
    '    return {"status": "ok"}',
    "",
    '@app.post("/v1/chat/completions")',
    "async def chat(request: Request):",
    "    body = await request.json()",
    '    messages = body.get("messages", [])',
    '    stream = body.get("stream", False)',
    '    temperature = body.get("temperature", 0.7)',
    '    max_tokens = body.get("max_tokens", 4096)',
    "    if stream:",
    "        def generate():",
    "            for chunk in llm.create_chat_completion(",
    "                messages=messages, stream=True,",
    "                temperature=temperature, max_tokens=max_tokens,",
    "            ):",
    '                yield "data: " + json.dumps(chunk) + chr(10) + chr(10)',
    '            yield "data: [DONE]" + chr(10) + chr(10)',
    '        return StreamingResponse(generate(), media_type="text/event-stream")',
    "    result = llm.create_chat_completion(",
    "        messages=messages, temperature=temperature, max_tokens=max_tokens,",
    "    )",
    "    return JSONResponse(content=result)",
    "",
    f'uvicorn.run(app, host="0.0.0.0", port={LLM_PORT})',
])

with open(os.path.join(WORK_DIR, "server.py"), "w") as f:
    f.write(server_py)

# ==== Step 4: Start server ====
print(f"🚀 Starting server on port {LLM_PORT}...")
log_file = open(SERVER_LOG, "w")
server_proc = subprocess.Popen(
    [sys.executable, os.path.join(WORK_DIR, "server.py")],
    stdout=log_file, stderr=subprocess.STDOUT,
    start_new_session=True,
)

import urllib.request
server_ready = False
print("⏳ Loading model into GPU...")
for i in range(150):
    if server_proc.poll() is not None:
        print(f"\\n❌ Server crashed! Code: {server_proc.returncode}")
        with open(SERVER_LOG) as f:
            print(f.read()[-2000:])
        break
    time.sleep(2)
    try:
        urllib.request.urlopen(f"http://localhost:{LLM_PORT}/v1/models", timeout=3)
        server_ready = True
        print(f"\\n✅ Server ready! (~{i*2}s)")
        break
    except:
        if i % 15 == 0 and i > 0:
            print(f"   Loading... ({i*2}s)")

# ==== Step 5: Tunnel ====
print("🔗 Creating tunnel...")
tunnel_url = None

def capture_url(proc):
    global tunnel_url
    try:
        for line in iter(proc.stderr.readline, b""):
            text = line.decode().strip()
            m = re.search(r"https://[a-zA-Z0-9-]+\\.trycloudflare\\.com", text)
            if m:
                tunnel_url = m.group(0)
                break
    except:
        pass

tunnel_proc = subprocess.Popen(
    ["cloudflared", "tunnel", "--url", f"http://localhost:{LLM_PORT}", "--no-autoupdate"],
    stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
    start_new_session=True,
)

reader = threading.Thread(target=capture_url, args=(tunnel_proc,))
reader.daemon = True
reader.start()
reader.join(timeout=30)

print()
print("=" * 60)
if tunnel_url:
    print("✅ ALL READY!")
    print(f"\\n📋 YOUR TUNNEL URL (copy this):")
    print(f"   {tunnel_url}")
    print(f"\\n👉 Paste this URL in PomeGranate Settings → Connect")
else:
    print("⚠️ Could not capture tunnel URL.")
print("=" * 60)

try:
    while True:
        time.sleep(60)
except KeyboardInterrupt:
    print("\\n⚠️ Cell stopped — server & tunnel keep running!")
    if tunnel_url:
        print(f"📋 Tunnel URL: {tunnel_url}")
`;
}

/**
 * Generate both cells.
 */
export function generateNotebookCells(): NotebookCells {
    return {
        kaggleCell: generateKaggleCell(),
        colabCell: generateColabCell(),
    };
}
