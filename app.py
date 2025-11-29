from flask import Flask, jsonify, send_file
from flask_cors import CORS
import qrcode
import io

app = Flask(__name__)
CORS(app)

# Global queue
queue = []
next_number = 1

# 5 counters, each with its current number
counters = {i: None for i in range(1, 6)}

@app.route("/take_number", methods=["POST"])
def take_number():
    global next_number
    ticket = next_number
    queue.append(ticket)
    next_number += 1
    return jsonify({"your_number": ticket})

@app.route("/call_next/<int:counter_id>", methods=["POST"])
def call_next(counter_id):
    if counter_id not in counters:
        return jsonify({"error": "Invalid counter"}), 400
    
    if queue:
        current = queue.pop(0)  # take from global queue
        counters[counter_id] = current
        return jsonify({"counter": counter_id, "called_number": current})
    else:
        return jsonify({"message": "No one in queue"})

@app.route("/status", methods=["GET"])
def status():
    # Show current number at each counter
    return jsonify(counters)

@app.route("/queue", methods=["GET"])
def queue_status():
    # Show waiting queue
    return jsonify({"waiting": queue})

@app.route("/set_counter/<int:counter_id>/<int:number>", methods=["POST"])
def set_counter(counter_id, number):
    if counter_id not in counters:
        return jsonify({"error": "Invalid counter"}), 400
    counters[counter_id] = number
    return jsonify({"message": f"Counter {counter_id} set to {number}."})

@app.route("/reset_counters", methods=["POST"])
def reset_counters():
    global queue, next_number, counters
    # Clear all counters
    for key in counters:
        counters[key] = None
    # Clear waiting queue
    queue = []
    # Reset ticket numbering back to 1
    next_number = 1
    return jsonify({"message": "All counters and queue reset."})

#@app.route("/ticket/<int:number>", methods=["GET"])
#def ticket(number):
    # Generate QR code linking to customer.html with number
 #   url = f"http://127.0.0.1:5000/customer.html?number={number}"
  #  img = qrcode.make(url)
   # buf = io.BytesIO()
    #img.save(buf, format="PNG")
    #buf.seek(0)
    #return send_file(buf, mimetype="image/png")

if __name__ == "__main__":
    app.run(debug=True)