import json
import os

# data/ is one folder up from server/
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# Only these files can be read or written
ALLOWED = ["managers", "households", "medications", "appointments", "doctors"]


def file_path(name):
    if name not in ALLOWED:
        raise ValueError("Unknown data file: " + name)
    return os.path.join(DATA_DIR, name + ".json")


def read_data(name):
    try:
        with open(file_path(name), "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        return []   # no file yet means no data yet


def write_data(name, data):
    with open(file_path(name), "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)
