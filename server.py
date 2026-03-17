#!/usr/bin/env python3
"""Simple HTTP server with range request support (needed for video)."""
import os, sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

class RangeHTTPRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if 'Range' not in self.headers:
            return super().do_GET()

        # Parse range header
        range_hdr = self.headers['Range']
        if not range_hdr.startswith('bytes='):
            return super().do_GET()

        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            self.send_error(404)
            return

        file_size = os.path.getsize(path)
        range_spec = range_hdr[6:]  # strip "bytes="
        parts = range_spec.split('-')
        start = int(parts[0]) if parts[0] else 0
        end = int(parts[1]) if parts[1] else file_size - 1
        end = min(end, file_size - 1)
        length = end - start + 1

        self.send_response(206)
        ctype = self.guess_type(path)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
        self.send_header('Content-Length', str(length))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()

        with open(path, 'rb') as f:
            f.seek(start)
            self.wfile.write(f.read(length))

    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8088
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    httpd = HTTPServer(('', port), RangeHTTPRequestHandler)
    print(f'Serving on http://localhost:{port}')
    httpd.serve_forever()
