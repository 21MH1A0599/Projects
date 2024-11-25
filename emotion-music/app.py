from flask import Flask, render_template, request, jsonify
import boto3
import os
import random

app = Flask(__name__)

# AWS Rekognition setup
rekognition_client = boto3.client('rekognition', region_name='us-east-1')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect-emotion', methods=['POST'])
def detect_emotion():
    image = request.files['image']
    image_bytes = image.read()

    response = rekognition_client.detect_faces(
        Image={'Bytes': image_bytes},
        Attributes=['ALL']
    )

    # Check if any face details were returned
    if len(response['FaceDetails']) == 0:
        return jsonify({'emotion': 'No face detected'})

    # Get the emotions
    emotions = response['FaceDetails'][0]['Emotions']
    
    # Get the emotion with the highest confidence
    dominant_emotion = max(emotions, key=lambda x: x['Confidence'])['Type']
    return jsonify({'emotion': dominant_emotion})

@app.route('/get-songs/<emotion>')
def get_songs(emotion):
    # Define the directory for each emotion
    emotion_map = {
        'HAPPY': 'happy',
        'SAD': 'sad',
        'SURPRISED': 'surprised',
        'ANGRY': 'angry',
        'CALM': 'others'
    }

    # Only fetch songs if a valid emotion is detected
    if emotion not in emotion_map:
        return jsonify({'songs': []})

    folder = emotion_map[emotion]
    songs_path = f'static/{folder}/'

    # Log the folder being accessed
    print(f"Accessing songs from folder: {songs_path}")

    try:
        songs = os.listdir(songs_path)
        # Log the songs found
        print(f"Songs available: {songs}")
        return jsonify(songs)
    except FileNotFoundError:
        print(f"Folder not found: {songs_path}")
        return jsonify([])

if __name__ == '__main__':
    app.run(debug=True)
