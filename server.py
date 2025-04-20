import http.server
import socketserver
from scripts.config import MAIN_SERVER_PORT

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", MAIN_SERVER_PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{MAIN_SERVER_PORT}")
    httpd.serve_forever() 