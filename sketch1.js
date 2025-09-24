let video;        // webcam stream
let canvas;       // canvas for drawing video/image
let img;          // current image being displayed
let input1, input2, input3; // input boxes
let strikeButton, liveButton; 
let countdown = 0; // countdown timer
let countdownInterval;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Webcam capture (hidden by default, we draw it onto canvas ourselves)
  video = createCapture(VIDEO);
  video.hide();
  img = video;

  // --- Input fields (left side) ---
  input1 = createInput("").attribute("placeholder", "_____ is where I come from");
  input1.position(50, 50);
  input1.size(300);

  input2 = createInput("").attribute("placeholder", "and I dream about _______");
  input2.position(50, 100);
  input2.size(300);

  input3 = createInput("").attribute("placeholder", "in nature I would be ______");
  input3.position(50, 150);
  input3.size(300);

  // --- Buttons ---
  strikeButton = createButton("Strike a Pose");
  strikeButton.position(50, 200);
  strikeButton.mousePressed(startCountdown);

  liveButton = createButton("Back to Live");
  liveButton.position(180, 200);
  liveButton.mousePressed(() => { img = video; });

}

function draw() {
  background(240);

  // Right 2/3 area for webcam or generated image
  let camX = width / 3 + 20;  // small margin
  let camY = 40;
  let camW = width * 2 / 3 - 40; // leave border space
  let camH = height - 80;

  if (img) {
    image(img, camX, camY, camW, camH);
  }

  // If countdown is running, show it in big numbers
  if (countdown > 0) {
    textAlign(CENTER, CENTER);
    textSize(90);
    fill(255, 255, 255, 200);
    text(countdown, width / 2, height / 2);
  }
}

// --- Countdown before taking a snapshot ---
function startCountdown() {
  countdown = 3;
  clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      takeSnapshot();
    }
  }, 1000);
}

// --- Take snapshot and send to AI model ---
async function takeSnapshot() {
  countdown = 0;

  // Save current canvas pixels to base64
  canvas = createGraphics(video.width, video.height);
  canvas.image(video, 0, 0);
  let imgBase64 = canvas.elt.toDataURL();

  // Combine prompts
  let finalPrompt = `A dreamy illustration, in a combination of the art style of ${input1.value()} and ${input2.value()}, the person’s body becomes a body of ${input3.value()}, abstract and surreal`;


  // Post to replicate (your AI model)
  let replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
  let authToken = ""; // put token if needed

  let postData = {
    model: "google/nano-banana",
    input: {
      prompt: finalPrompt,
      image_input: [imgBase64],
      output_format: "png",
    },
  };

  const options = {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`,
    },
    method: "POST",
    body: JSON.stringify(postData),
  };

  console.log("Sending to AI model:", postData);

  const response = await fetch(replicateProxy, options);
  const result = await response.json();
  console.log("AI result", result);

  // Load AI result image into canvas
  loadImage(result.output, (newImage) => {
    img = newImage;
  });
}
