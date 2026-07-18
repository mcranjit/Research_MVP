import os
from pathlib import Path
from pymongo import MongoClient

env = {}
p = Path('.env')
data = p.read_text()
for line in data.splitlines():
    line = line.strip()
    if not line or line.startswith('#') or '=' not in line:
        continue
    k, v = line.split('=', 1)
    env[k] = v.strip().strip('"').strip("'")
os.environ.update(env)

m = os.environ['MONGO_URL']
print('uri starts', m[:40])
client = MongoClient(m, serverSelectionTimeoutMS=10000, tlsAllowInvalidCertificates=True)
print(client.admin.command('ping'))
client.close()
