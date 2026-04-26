const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const hintEl = document.getElementById('hint');
const volNumberEl = document.getElementById('vol-number');

const W = canvas.width, H = canvas.height;
const ROWS = 9, PEG_R = 6, BALL_R = 7;
const PAD_X = 28, PAD_Y = 44, BOTTOM = H - 34;
const pegSpacing = 30;

let SLOTS = 8, slotValues = [];
let currentVolume = 50;
let ball = null, dropping = false, animId = null;
let mouseX = W / 2, mouseOnCanvas = false;

function updateVolDisplay(v) {
  volNumberEl.textContent = v + '%';
}

function randomizeBins() {
  SLOTS = 6 + Math.floor(Math.random() * 5); // 6–10 bins
  slotValues = Array.from({ length: SLOTS }, (_, i) =>
    Math.round((i / (SLOTS - 1)) * 100)
  );
  // Jitter the midpoints for variety
  for (let i = 1; i < SLOTS - 1; i++) {
    slotValues[i] = Math.max(
      slotValues[i - 1] + 1,
      Math.min(
        slotValues[i + 1] - 1,
        slotValues[i] + Math.round((Math.random() - 0.5) * 18)
      )
    );
  }
  slotValues[0] = 0;
  slotValues[SLOTS - 1] = 100;
}

function getPegs() {
  const pegs = [];
  const cx = W / 2;
  const rowH = (BOTTOM - PAD_Y - 10) / ROWS;
  for (let r = 0; r < ROWS; r++) {
    const n = 3 + r;
    const rowW = (n - 1) * pegSpacing;
    const rx = cx - rowW / 2;
    for (let p = 0; p < n; p++) {
      pegs.push({ x: rx + p * pegSpacing, y: PAD_Y + r * rowH });
    }
  }
  return pegs;
}

const pegs = getPegs();
const sw = () => (W - PAD_X * 2) / SLOTS;
const slotCx = i => PAD_X + sw() * i + sw() / 2;
const clampAim = x => Math.max(PAD_X + BALL_R + 2, Math.min(W - PAD_X - BALL_R - 2, x));

function draw() {
  ctx.clearRect(0, 0, W, H);
  const s = sw();

  // Slot base
  ctx.fillStyle = 'rgba(0,0,0,0.055)';
  ctx.fillRect(PAD_X, BOTTOM, W - PAD_X * 2, H - BOTTOM - 2);

  // Aim column highlight
  if (mouseOnCanvas && !dropping) {
    const ax = clampAim(mouseX);
    const approxSlot = Math.min(SLOTS - 1, Math.max(0, Math.floor((ax - PAD_X) / s)));
    ctx.fillStyle = 'rgba(226,75,74,0.13)';
    ctx.fillRect(PAD_X + approxSlot * s + 1, BOTTOM, s - 2, H - BOTTOM - 2);
  }

  // Slot dividers and labels
  for (let i = 0; i < SLOTS; i++) {
    const x0 = PAD_X + i * s;

    // Highlight landed slot
    if (currentVolume === slotValues[i]) {
      ctx.fillStyle = 'rgba(226,75,74,0.28)';
      ctx.fillRect(x0 + 1, BOTTOM, s - 2, H - BOTTOM - 2);
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x0, BOTTOM);
    ctx.lineTo(x0, H - 2);
    ctx.stroke();

    ctx.fillStyle = currentVolume === slotValues[i] ? '#c0392b' : '#666';
    ctx.font = `${s > 36 ? 11 : 9}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(slotValues[i], slotCx(i), H - 8);
  }

  // Final right divider
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(PAD_X + SLOTS * s, BOTTOM);
  ctx.lineTo(PAD_X + SLOTS * s, H - 2);
  ctx.stroke();

  // Pegs
  pegs.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, PEG_R, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    // Inner highlight
    ctx.beginPath();
    ctx.arc(p.x - 1.5, p.y - 1.5, PEG_R - 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fill();
  });

  // Aim guide (ghost ball + dashed line)
  if (mouseOnCanvas && !dropping) {
    const ax = clampAim(mouseX);
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(226,75,74,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ax, 2);
    ctx.lineTo(ax, PAD_Y - 16);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(ax, PAD_Y - 16, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(226,75,74,0.3)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(163,45,45,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Live ball
  if (ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = '#e24b4a';
    ctx.fill();
    ctx.strokeStyle = '#a32d2d';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Shine
    ctx.beginPath();
    ctx.arc(ball.x - 2, ball.y - 2, BALL_R - 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fill();
  }
}

function drop(startX) {
  if (dropping) return;
  dropping = true;
  randomizeBins(); // shuffle bins on every drop
  hintEl.textContent = 'Ball in flight…';
  ball = {
    x: startX + (Math.random() - 0.5) * 4,
    y: PAD_Y - 22,
    vx: (Math.random() - 0.5) * 0.5,
    vy: 1.2
  };

  function step() {
    ball.vy += 0.31;
    ball.vx *= 0.999;
    ball.x += ball.vx;
    ball.y += ball.vy;

    const L = PAD_X + BALL_R, R = W - PAD_X - BALL_R;
    if (ball.x < L) { ball.x = L; ball.vx = Math.abs(ball.vx) * 0.6; }
    if (ball.x > R) { ball.x = R; ball.vx = -Math.abs(ball.vx) * 0.6; }

    // Peg collisions
    pegs.forEach(p => {
      const dx = ball.x - p.x, dy = ball.y - p.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < BALL_R + PEG_R) {
        const nx = dx / d, ny = dy / d;
        const ov = BALL_R + PEG_R - d;
        ball.x += nx * ov;
        ball.y += ny * ov;
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= 1.3 * dot * nx + (Math.random() - 0.5) * 0.22;
        ball.vy -= 1.3 * dot * ny;
        ball.vy = Math.max(ball.vy, 0.3);
      }
    });

    // Floor / settle
    if (ball.y >= BOTTOM - BALL_R) {
      ball.y = BOTTOM - BALL_R;
      ball.vy *= -0.2;
      ball.vx *= 0.5;
      if (Math.abs(ball.vy) < 0.35) {
        const slot = Math.min(SLOTS - 1, Math.max(0, Math.floor((ball.x - PAD_X) / sw())));
        currentVolume = slotValues[slot];
        updateVolDisplay(currentVolume);
        dropping = false;
        hintEl.textContent = 'Move over the board to aim, click to drop';
        draw();
        return;
      }
    }

    // Live preview of current column while falling
    const liveSlot = Math.min(SLOTS - 1, Math.max(0, Math.floor((ball.x - PAD_X) / sw())));
    updateVolDisplay(slotValues[liveSlot]);

    draw();
    animId = requestAnimationFrame(step);
  }

  animId = requestAnimationFrame(step);
}

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouseX = e.clientX - r.left;
  mouseOnCanvas = true;
  if (!dropping) { hintEl.textContent = 'Click to drop here'; draw(); }
});

canvas.addEventListener('mouseleave', () => {
  mouseOnCanvas = false;
  if (!dropping) { hintEl.textContent = 'Move over the board to aim, click to drop'; draw(); }
});

canvas.addEventListener('click', e => {
  if (dropping) return;
  const r = canvas.getBoundingClientRect();
  drop(clampAim(e.clientX - r.left));
});

document.getElementById('btn-reset').addEventListener('click', () => {
  if (animId) cancelAnimationFrame(animId);
  dropping = false;
  ball = null;
  currentVolume = 50;
  randomizeBins();
  updateVolDisplay(50);
  hintEl.textContent = 'Move over the board to aim, click to drop';
  draw();
});

// Init
randomizeBins();
updateVolDisplay(currentVolume);
draw();