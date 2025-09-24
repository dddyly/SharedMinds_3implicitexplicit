let video;        // webcam stream
let img;          // current image being displayed
let input1, input2, input3; // input boxes
let strikeButton, liveButton; 
let countdown = 0; // countdown timer
let countdownInterval;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // --- Webcam capture ---
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  img = video; // show live video initially

  // --- Input fields (left side) ---
  input1 = createInput("").attribute("placeholder", "_____ is where I come from");
  input1.position(50, 50);
  input1.size(300);

  input2 = createInput("").attribute("placeholder", "and I dream about _______");
  input2.position(50, 100);
  input2.size(300);

  input3 = createInput("").attribute("placeholder", "in nature I would be a body of______");
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

  // --- Right 2/3 area for webcam or AI image ---
  let camX = width / 3 + 20;
  let camY = 40;
  let camW = width * 2 / 3 - 40;
  let camH = height - 80;

  if (img) {
    image(img, camX, camY, camW, camH);
  }

  // --- Countdown overlay ---
  if (countdown > 0) {
    textAlign(CENTER, CENTER);
    textSize(90);
    fill(255, 0, 0, 200);
    text(countdown, width / 2, height / 2);
  }
}

// --- Countdown logic ---
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

// --- Capture snapshot and send to AI ---
async function takeSnapshot() {
  countdown = 0;

  // --- Use separate graphics buffer to snapshot webcam ---
  let snapshotCanvas = createGraphics(640, 480);
  snapshotCanvas.image(video, 0, 0, 640, 480);
  let imgBase64 = snapshotCanvas.elt.toDataURL();

  // --- Build AI prompt ---
 let finalPrompt = `A dreamy illustration, in a combination fusion of the art style from ${input1.value()} and ${input2.value()}, the person's body becomes a body of ${input3.value()}, abstract and surreal, please don’t show any human facial feature or face, make a line// patter with the material with ${input3.value()} to the body `;

  // --- AI request ---
  let replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
  let authToken = ""; // put token if required

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

  try {
    const response = await fetch(replicateProxy, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (!result.output) throw new Error("No image returned");

    loadImage(result.output, (newImage) => { img = newImage; });
  } catch (err) {
    console.error("Error generating image:", err);
    alert("Failed to generate image. Check console for details.");
  }
}
