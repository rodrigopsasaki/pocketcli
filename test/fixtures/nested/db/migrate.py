#!/usr/bin/env python3
# Run database migrations
import os

print(f"migrate:{os.environ.get('RUNIC_COMMAND', 'unknown')}")
