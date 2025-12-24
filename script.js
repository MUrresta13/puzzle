"use strict";

/**
 * Simple 4x4 sliding image puzzle (15-puzzle).
 * Uses Santa.PNG in repo root.
 * Win => GIFTSARENEVERFREE + copy.
 */

const IMG_SRC = "Santa.PNG";
const PASSCODE = "GIFTSARENEVERFREE";
const SIZE = 4; // 4x4 = 15 tiles + 1 empty

// Screens
const screenIntro = document.getElementById("screenIntro");
const screenTitle = document.getElementById("screenTitle");
const screenGame  = document.getElementById("screenGame");

const btnStart = document.getElementById("btnStart");
const btnPlay = document.getElementById("btnPlay");

// Game UI
const boardEl = document.getElementById("board");
const movesEl = document.getElementById("moves");
const statusEl = document.getElementById("status");
const btnShuffle = document.getElementById("btnShuffle");
const btnReset = document.getElementById("btnReset");

// Modal
const winModal = document.getElementById("winModal");
const btnCopy = document.getElementById("btnCopy");
const btnAgain = document.getElementById("btnAgain");
const btnBackTitle = document.getElementById("btnBackTitle");
const copyMsg = document.getElementById("copyMsg");

// Image refs
const refImg = document.getElementById("refImg");

// State
let tiles = [];  // length SIZE*SIZE, values 1..15 and 0 for empty
let moves = 0;

function showScreen(s){
  hideModal();
  screenIntro.classList.remove("active");
  screenTitle.classList.remove("active");
  screenGame.classList.remove("active");
  s.classList.add("active");
}

function setStatus(msg, kind=""){
  statusEl.textContent = msg;
  statusEl.style.color =
    kind === "ok" ? "rgba(124,255,161,.95)" :
    kind === "bad" ? "rgba(255,107,107,.95)" :
    "rgba(255,255,255,.86)";
}

function showModal(){
  winModal.classList.add("show");
  winModal.setAttribute("aria-hidden","false");
}
function hideModal(){
  winModal.classList.remove("show");
  winModal.setAttribute("aria-hidden","true");
  copyMsg.textContent = "";
}

function indexToRC(i){
  return { r: Math.floor(i / SIZE), c: i % SIZE };
}

function rcToIndex(r,c){
  return r * SIZE + c;
}

function neighborsOfEmpty(emptyIdx){
  const {r,c} = indexToRC(emptyIdx);
  const n = [];
  if(r > 0) n.push(rcToIndex(r-1,c));
  if(r < SIZE-1) n.push(rcToIndex(r+1,c));
  if(c > 0) n.push(rcToIndex(r,c-1));
  if(c < SIZE-1) n.push(rcToIndex(r,c+1));
  return n;
}

function isSolved(){
  for(let i=0;i<SIZE*SIZE-1;i++){
    if(tiles[i] !== i+1) return false;
  }
  return tiles[SIZE*SIZE-1] === 0;
}

function render(){
  boardEl.innerHTML = "";
  boardEl.style.setProperty("--img", `url('${IMG_SRC}')`);
  movesEl.textContent = String(moves);

  for(let i=0;i<tiles.length;i++){
    const v = tiles[i];

    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.style.setProperty("--img", `url('${IMG_SRC}')`);

    if(v === 0){
      tile.classList.add("empty");
      tile.disabled = true;
      boardEl.appendChild(tile);
      continue;
    }

    // v is 1..15. It belongs to solved position (v-1)
    const correctIndex = v - 1;
    const { r: cr, c: cc } = indexToRC(correctIndex);

    // background-position for the piece in a 4x4 grid
    // using percentages to match background-size: 400% 400%
    const x = (cc * 100) / (SIZE - 1);
    const y = (cr * 100) / (SIZE - 1);
    tile.style.setProperty("--pos", `${x}% ${y}%`);

    // optional small number (helps “easy”)
    const num = document.createElement("div");
    num.className = "num";
    num.textContent = String(v);
    tile.appendChild(num);

    tile.addEventListener("click", () => tryMove(i));
    boardEl.appendChild(tile);
  }
}

function tryMove(tileIdx){
  hideModal();

  const emptyIdx = tiles.indexOf(0);
  const legal = neighborsOfEmpty(emptyIdx);
  if(!legal.includes(tileIdx)){
    setStatus("That tile isn’t next to the empty space.", "bad");
    return;
  }

  // swap
  [tiles[emptyIdx], tiles[tileIdx]] = [tiles[tileIdx], tiles[emptyIdx]];
  moves++;
  render();

  if(isSolved()){
    setStatus("Solved!", "ok");
    showModal();
  }else{
    setStatus("Keep going.", "");
  }
}

/**
 * Create a solved board: [1..15,0]
 */
function makeSolved(){
  tiles = [];
  for(let i=1;i<SIZE*SIZE;i++) tiles.push(i);
  tiles.push(0);
}

/**
 * Shuffle by doing many random valid moves from solved.
 * This guarantees solvable puzzles every time.
 */
function shuffleBoard(steps=80){
  makeSolved();
  let emptyIdx = tiles.indexOf(0);

  let lastMove = null;
  for(let s=0;s<steps;s++){
    const opts = neighborsOfEmpty(emptyIdx).filter(i => i !== lastMove);
    const pick = opts[Math.floor(Math.random() * opts.length)];

    // swap with empty
    [tiles[emptyIdx], tiles[pick]] = [tiles[pick], tiles[emptyIdx]];
    lastMove = emptyIdx;
    emptyIdx = pick;
  }
}

function resetGame(shuffle=true){
  moves = 0;
  hideModal();
  setStatus("Tap a tile next to the empty space to move it.", "");

  if(shuffle){
    shuffleBoard(80);
  }else{
    makeSolved();
  }

  render();
}

// Clipboard
async function copyToClipboard(text){
  if(navigator.clipboard?.writeText){
    await navigator.clipboard.writeText(text);
    return true;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  return ok;
}

// Buttons
btnStart.addEventListener("click", () => showScreen(screenTitle));
btnPlay.addEventListener("click", () => {
  showScreen(screenGame);
  resetGame(true);
});

btnShuffle.addEventListener("click", () => resetGame(true));
btnReset.addEventListener("click", () => resetGame(true)); // Reset = re-scramble

btnAgain.addEventListener("click", () => resetGame(true));
btnBackTitle.addEventListener("click", () => showScreen(screenTitle));

btnCopy.addEventListener("click", async () => {
  try{
    const ok = await copyToClipboard(PASSCODE);
    copyMsg.textContent = ok ? "Copied to clipboard." : "Copy failed — copy manually.";
  }catch{
    copyMsg.textContent = "Copy failed — copy manually.";
  }
});

// If image missing, show a useful status message
refImg.addEventListener("error", () => {
  setStatus("Santa.PNG not found. Add Santa.PNG to the repo root (same folder as index.html).", "bad");
});

// Boot
showScreen(screenIntro);
