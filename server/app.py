from flask import Flask

# public/ is one folder up from server/
# static_url_path="" means /login.html works, not /static/login.html
app = Flask(__name__, static_folder="../public", static_url_path="")


# "/" is the home page: send index.html
@app.route("/")
def home():
    return app.send_static_file("index.html")


# Only runs when you start this file directly (python server/app.py)
if __name__ == "__main__":
    app.run(debug=True)   # debug only on your computer; turned off in Section 4
