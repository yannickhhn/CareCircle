import json
import os

# Point to data/, one folder up from server/
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# Allow reading and writing only these files
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
        return []   # Return [] if the file doesn't exist yet


def write_data(name, data):
    with open(file_path(name), "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)
