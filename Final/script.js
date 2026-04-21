const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

let currentVolume = 50;

const W = canvas.width;
const H = canvas.height;
const ROWS = 9;
const PEG_R = 7;  // Increased from 4 to 7
const BALL_R = 7;
const PAD_X = 30;
const PAD_Y = 45;
const BOTTOM = H - 30;
const SLOTS = 8;
const slotW = (W - PAD_X * 2) / SLOTS;

function getPegs() {
  const pegs = [];
  const startX = W / 2;
  const startY = PAD_Y;
  const rowSpacing = (BOTTOM - PAD_Y - 20) / ROWS;
  const pegSpacing = 32;  // Increased from 26 to give bigger pegs more room
  
  // Start with 3 pegs in the first row
  const startPegs = 3;
  
  for (let row = 0; row < ROWS; row++) {
    // Each row increases by 1 peg, starting from 3
    const pegsInRow = startPegs + row;
    const rowWidth = (pegsInRow - 1) * pegSpacing;
    const rowStartX = startX - rowWidth / 2;
    
    for (let p = 0; p < pegsInRow; p++) {
      const x = rowStartX + p * pegSpacing;
      const y = startY + row * rowSpacing;
      pegs.push({ x, y });
    }
  }
  return pegs;
}

const pegs = getPegs();

function slotCenter(i) {
  return PAD_X + slotW * i + slotW / 2;
}

function slotVolume(i) {
  const volumes = [0, 15, 30, 45, 60, 75, 90, 100];
  return volumes[i];
}

function draw(ball) {
  ctx.clearRect(0, 0, W, H);

  // Draw faint triangle guide lines
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.beginPath();
  ctx.moveTo(W/2, PAD_Y - 10);
  ctx.lineTo(PAD_X - 5, BOTTOM);
  ctx.lineTo(W - PAD_X + 5, BOTTOM);
  ctx.fill();
  ctx.restore();

  // Slot background strip
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.fillRect(PAD_X, BOTTOM, W - PAD_X * 2, H - BOTTOM - 4);

  // Slot dividers
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= SLOTS; i++) {
    const x = PAD_X + i * slotW;
    ctx.beginPath();
    ctx.moveTo(x, BOTTOM);
    ctx.lineTo(x, H - 4);
    ctx.stroke();
  }

  // Slot fills and labels
  for (let i = 0; i < SLOTS; i++) {
    const vol = slotVolume(i);
    const cx = slotCenter(i);

    // Highlight active slot
    if (currentVolume === vol) {
      ctx.fillStyle = 'rgba(226,75,74,0.35)';
    } else {
      ctx.fillStyle = 'transparent';
    }
    ctx.fillRect(PAD_X + i * slotW + 1, BOTTOM, slotW - 2, H - BOTTOM - 4);

    // Slot volume label
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(vol + '%', cx, H - 6);
  }

  // Pegs - now bigger and with a subtle highlight
  pegs.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, PEG_R, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    // Add a subtle inner highlight
    ctx.beginPath();
    ctx.arc(p.x - 1, p.y - 1, PEG_R - 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Ball
  if (ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = '#e24b4a';
    ctx.fill();
    ctx.strokeStyle = '#a32d2d';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

let animId = null;
let ball = null;
let dropping = false;

function startDrop() {
  if (dropping) return;
  dropping = true;
  status.textContent = '';

  const startX = W / 2 + (Math.random() - 0.5) * 10;
  ball = { x: startX, y: 12, vx: (Math.random() - 0.5) * 0.8, vy: 1.5 };

  function step() {
    ball.vy += 0.35;
    ball.vx *= 0.998;
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall collisions
    const leftWall = PAD_X - 5;
    const rightWall = W - PAD_X + 5;
    
    if (ball.x < leftWall + BALL_R) {
      ball.x = leftWall + BALL_R;
      ball.vx = Math.abs(ball.vx) * 0.6;
    }
    if (ball.x > rightWall - BALL_R) {
      ball.x = rightWall - BALL_R;
      ball.vx = -Math.abs(ball.vx) * 0.6;
    }

    // Peg collisions
    pegs.forEach(p => {
      const dx = ball.x - p.x;
      const dy = ball.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < BALL_R + PEG_R) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = BALL_R + PEG_R - dist;
        ball.x += nx * overlap;
        ball.y += ny * overlap;
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= 1.3 * dot * nx + (Math.random() - 0.5) * 0.3;
        ball.vy -= 1.3 * dot * ny;
        ball.vy = Math.max(ball.vy, 0.3);
      }
    });

    // Bottom collision / settle
    if (ball.y >= BOTTOM - BALL_R) {
      ball.y = BOTTOM - BALL_R;
      ball.vy *= -0.2;
      ball.vx *= 0.5;
      if (Math.abs(ball.vy) < 0.4) {
        ball.vy = 0;
        const slot = Math.min(SLOTS - 1, Math.max(0, Math.floor((ball.x - PAD_X) / slotW)));
        const vol = slotVolume(slot);
        currentVolume = vol;
        status.textContent = 'Volume set to ' + vol + '%';
        draw(ball);
        dropping = false;
        return;
      }
    }

    draw(ball);
    animId = requestAnimationFrame(step);
  }

  animId = requestAnimationFrame(step);
}

function resetBoard() {
  if (animId) cancelAnimationFrame(animId);
  dropping = false;
  ball = null;
  currentVolume = 50;
  status.textContent = '';
  draw(null);
}

document.getElementById('btn-drop').addEventListener('click', startDrop);

document.getElementById('btn-reset').addEventListener('click', resetBoard);

document.getElementById('btn-submit').addEventListener('click', () => {
  if (dropping) {
    status.textContent = 'Wait for the ball to land!';
    return;
  }
  status.textContent = 'Submitted: ' + currentVolume + '% volume';
});

// Initial render
draw(null);