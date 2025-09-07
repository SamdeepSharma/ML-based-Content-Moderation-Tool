from flask import Flask, request, jsonify
import pickle
import numpy as np
import re
from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer
from sklearn.base import BaseEstimator, TransformerMixin
from flask_cors import CORS

# Preprocess

stop_words = set(stopwords.words('english'))
stemmer = SnowballStemmer('english')

def clean_text(text):
    text = text.lower()
    text = re.sub(r"what's", "what is ", text)
    text = re.sub(r"\'s", " ", text)
    text = re.sub(r"\'ve", " have ", text)
    text = re.sub(r"can't", "can not ", text)
    text = re.sub(r"don't", "do not", text)
    text = re.sub(r"n't", " not ", text)
    text = re.sub(r"i'm", "i am ", text)
    text = re.sub(r"\W", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def remove_stopwords(text):
    return ' '.join([w for w in text.split() if w not in stop_words])

def stemming(text):
    return ' '.join([stemmer.stem(w) for w in text.split()])

def preprocess_text(text):
    text = clean_text(text)
    text = remove_stopwords(text)
    text = stemming(text)
    return text

# Custom Feature Extractor

class CustomTextFeatures(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        features = []
        for text in X:
            length = len(text)
            num_words = len(text.split())
            num_uppercase = sum(1 for w in text.split() if w.isupper())
            num_exclaims = text.count('!')
            features.append([length, num_words, num_uppercase, num_exclaims])
        return np.array(features)

# Flask Setup

app = Flask(__name__)

CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"]
)

# Loading Trained Pipeline
try:
    with open("rf_trained_models.pkl", "rb") as f:
        trained_models = pickle.load(f)
    
    with open("rf_thresholds.pkl", "rb") as f:
        thresholds = pickle.load(f)
    
    print(" Models and thresholds loaded successfully!")
    print(f"Available labels: {list(trained_models.keys())}")
    
except FileNotFoundError as e:
    print(f" Error loading models: {e}")
    trained_models = {}
    thresholds = {}

@app.after_request
def after_request(response):
    """Add CORS headers to every response"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route("/classify", methods=["POST", "OPTIONS"])
def classify_comment():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        comment = data.get("comment")

        if not comment or not comment.strip():
            return jsonify({"error": "No comment provided or comment is empty"}), 400

        if not trained_models:
            return jsonify({"error": "Models not loaded properly"}), 500
        
        # Preprocess the comment

        processed_comment = preprocess_text(comment)

        # predictions for all labels
        all_predictions = {}
        for label in trained_models:
            pipeline = trained_models[label]
            prob = pipeline.predict_proba([processed_comment])[0][1]
            pred = int(prob >= thresholds[label])

            all_predictions[label] = {
                "predicted": pred,
                "confidence": round(prob * 100, 2)
            }

        # Confidence for primary classification
        if all_predictions:
            primary_label = max(all_predictions.items(), key=lambda x: x[1]['confidence'])
            primary_category = primary_label[0]
            primary_confidence = primary_label[1]["confidence"]
            
            response = {
                "category": primary_category,
                "confidence": primary_confidence,
                "all_predictions": all_predictions 
            }
        else:
            response = {
                "category": "Unknown",
                "confidence": 0,
                "all_predictions": {}
            }

        return jsonify(response)

    except Exception as e:
        print(f"Error in classify_comment: {str(e)}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "models_loaded": len(trained_models) > 0,
        "available_labels": list(trained_models.keys()) if trained_models else []
    })

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)