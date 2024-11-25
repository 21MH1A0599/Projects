const video = document.getElementById('video');
const captureButton = document.getElementById('capture');
const emotionText = document.getElementById('emotion-text');
const audioElement = document.getElementById('audio');

navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(error => {
        console.error('Error accessing webcam:', error);
    });

captureButton.addEventListener('click', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    // Convert to Blob for upload
    const byteString = atob(imageData.split(',')[1]);
    const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });

    const formData = new FormData();
    formData.append('image', blob, 'image.jpg');

    const response = await fetch('/detect-emotion', {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();
    const emotion = data.emotion;
    emotionText.textContent = `Detected Emotion: ${emotion}`;
    
    if (emotion === 'No face detected') {
        // Clear any currently playing audio
        audioElement.pause();
        audioElement.src = ''; // Stop audio playback
        return; // Exit the function
    }
    
    fetchSongsAndPlay(emotion);
});

async function fetchSongsAndPlay(emotion) {
    const response = await fetch(`/get-songs/${emotion}`);
    const songs = await response.json();

    if (songs.length > 0) {
        // Select a random song
        const randomSong = songs[Math.floor(Math.random() * songs.length)];
        audioElement.src = `static/${emotion.toLowerCase()}/${randomSong}`;
        audioElement.play();
    } else {
        emotionText.textContent += ' (No songs available)';
    }
}
