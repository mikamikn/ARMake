const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const LIP = [61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185,61,78,191,80,81,82,13,312,311,310,415,308,324,318,402,317,14,87,178,88,95,78,61];
const RIGHT_CHEAK = [50,205,216,212,214,192,213,147,50];
const LEFT_CHEAK = [280,425,436,432,434,416,433,376,280];
const RIGHT_EYE_TOP = [33,246,161,159,158,157,173];
const LEFT_EYE_TOP = [466,388,387,386,385,384,398];

//faceMeshの初期化
const faceMesh = new FaceMesh({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
}});
faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);

let camera;

/**
 * startButton押下時の処理
 */
function startArMake()  {
    document.getElementsByClassName('start-make')[0].style.display = "none";
    document.getElementsByClassName('end-make')[0].style.display = "block";
    camera = new Camera(videoElement, {
        onFrame: async () => {
            await faceMesh.send({image: videoElement});
        },
        width: 640,
        height: 360
    });
    camera.start();
    const outputArea = document.getElementById('output-area');
    outputArea.style.display = "flex";
}

/**
 * endButton押下時の処理
 */
function endArMake() {
    document.getElementsByClassName('start-make')[0].style.display = "block";
    document.getElementsByClassName('end-make')[0].style.display = "none";
    if(camera) {
        camera.stop();
        const outputArea = document.getElementById('output-area');
        outputArea.style.display = "none";
    }
}

/**
 * targetMarksに指定された点を直線で結んだ枠内を指定されたcolorで塗りつぶします。
 * 
 * @param {*} ctx キャンバスコンテキスト
 * @param {*} marks faceMeshから受け取った点配列
 * @param {*} targetMarks 塗りつぶし対象の点の配列
 * @param {*} color 色
 */
function fillConnectors(ctx, marks, targetMarks, color) {
  ctx.fillStyle = color;
    //ちょっと丸みを持たせる（そんなに変わらないが。。）
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  let i = 0;
  for(const targetMark of targetMarks) {
    i++;
    const markFrom = marks[targetMark];
    if(i == 1) {
      ctx.moveTo(markFrom.x * canvasElement.width, markFrom.y * canvasElement.height);
    } else {
      ctx.lineTo(markFrom.x * canvasElement.width, markFrom.y * canvasElement.height);
    }
  }
  ctx.fill();
}

/**
 * アイラインを描画します。
 * 
 * @param {*} ctx キャンバスコンテキスト
 * @param {*} marks faceMeshの点配列
 */
function drawEyeLine(ctx, marks) {
  const color = document.getElementById("eyeline-color").value;
  if(!color) {
    return;
  }
  ctx.strokeStyle = color;
  //ちょっと丸みを持たせる（そんなに変わらないが。。）
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  
  let i = 0;
  const top = marks[10];
  const bottom = marks[0];
  //目の上からの距離を、顔の大きさと比例するようにする
  const ref = (bottom.y -top.y )/35;
  ctx.lineWidth = ref * 200;
  
  //左目
  ctx.beginPath();
  for(const targetMark of LEFT_EYE_TOP) {
    i++;
    const markFrom = marks[targetMark];
    if(i == 1) {
      ctx.moveTo(markFrom.x * canvasElement.width, (markFrom.y - ref)* canvasElement.height);
    } else {
      ctx.lineTo(markFrom.x * canvasElement.width, (markFrom.y - ref)* canvasElement.height);
    }
  }
  ctx.stroke();

  //右目
  ctx.beginPath();
  i = 0;
  for(const targetMark of RIGHT_EYE_TOP) {
    i++;
    const markFrom = marks[targetMark];
    if(i == 1) {
      ctx.moveTo(markFrom.x * canvasElement.width, (markFrom.y - ref)* canvasElement.height);
    } else {
      ctx.lineTo(markFrom.x * canvasElement.width, (markFrom.y - ref)* canvasElement.height);
    }
  }
  ctx.stroke();
}

/**
 * リップを描画します。
 * 
 * @param {*} ctx キャンバスコンテキスト
 * @param {*} marks faceMeshの点配列
 */
function drawLip(ctx, marks) {
  const color = document.getElementById("lip-color").value;
  if(!color) {
    return;
  }
  fillConnectors(ctx, marks, LIP,color);
}

/**
 * チークを描画します。
 * 
 * @param {*} ctx キャンバスコンテキスト
 * @param {*} marks faceMeshの点配列
 */
function drawCheak(ctx, marks) {
  const color = document.getElementById("cheak-color").value;
  if(!color) {
    return;
  }
  fillConnectors(ctx, marks, LEFT_CHEAK,color);
  fillConnectors(ctx, marks, RIGHT_CHEAK,color);
}

/**
 * faceMeshの解析結果を処理する
 * 
 * @param {*} results faceMeshの解析結果
 */
function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
        
      drawCheak(canvasCtx, landmarks);
      drawLip(canvasCtx, landmarks);
      drawEyeLine(canvasCtx, landmarks);
    }
  }
  canvasCtx.restore();
}