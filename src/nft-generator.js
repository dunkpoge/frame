// ============================================
// src/nft-generator.js - NFT Generation
// ============================================
import { CONFIG } from './config.js';

export function generateRandomSeed() {
  return Math.floor(Math.random() * 1000000000);
}

export function getTraitFromSeed(seed, position, maxValue) {
  return ((seed >> (position * 8)) % maxValue);
}

const SKIN_COLORS = ["#FFFFF0", "#F5DEB3", "#FFDAB9", "#D2B48C", "#F4A460"];
const EYE_COLORS = ["#0000FF", "#008000", "#808080", "#000000", "#8B4513"];
const LIP_COLORS = ["#000000", "#DC143C", "#FF1493", "#800080", "#0000FF"];
const HAIR_COLORS = ["#000000", "#8B4513", "#FFD700", "#FF0000", "#800080", "#FFC0CB"];

export function generateTraits(seed) {
  return {
    skinColor: SKIN_COLORS[getTraitFromSeed(seed, 0, SKIN_COLORS.length)],
    eyeColor: EYE_COLORS[getTraitFromSeed(seed, 2, EYE_COLORS.length)],
    lipColor: LIP_COLORS[getTraitFromSeed(seed, 4, LIP_COLORS.length)],
    hairColor: HAIR_COLORS[getTraitFromSeed(seed, 8, HAIR_COLORS.length)],
    hasHair: getTraitFromSeed(seed, 6, 100) < 80 // 80% have hair
  };
}

export function generateSVG(traits, quantity, remaining, price, maxSupply) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          .pixel { font-family: 'Press Start 2P', monospace; }
          .title { font-size: 48px; font-weight: bold; fill: white; }
          .subtitle { font-size: 20px; fill: #00ff00; }
          .stats { font-size: 16px; fill: white; }
        </style>
      </defs>
      
      <!-- Background -->
      <rect width="800" height="800" fill="#000000"/>
      
      <!-- Grid Pattern -->
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a1a1a" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="800" height="800" fill="url(#grid)"/>
      
      <!-- Main NFT Display -->
      <g transform="translate(250, 150)">
        <!-- Face -->
        <rect x="0" y="40" width="300" height="300" fill="${traits.skinColor}" stroke="#000" stroke-width="8"/>
        
        <!-- Hair -->
        ${traits.hasHair ? `<rect x="0" y="20" width="300" height="40" fill="${traits.hairColor}" stroke="#000" stroke-width="8"/>` : ''}
        
        <!-- Eyes -->
        <rect x="60" y="140" width="60" height="40" fill="${traits.eyeColor}" stroke="#000" stroke-width="4"/>
        <rect x="180" y="140" width="60" height="40" fill="${traits.eyeColor}" stroke="#000" stroke-width="4"/>
        
        <!-- Pupils -->
        <circle cx="90" cy="160" r="12" fill="#000"/>
        <circle cx="210" cy="160" r="12" fill="#000"/>
        
        <!-- Nose -->
        <rect x="135" y="200" width="30" height="30" fill="#000" opacity="0.3"/>
        
        <!-- Mouth -->
        <rect x="110" y="260" width="80" height="20" fill="${traits.lipColor}" stroke="#000" stroke-width="4"/>
        
        <!-- Ears (Doge style) -->
        <path d="M 0 100 L -20 60 L 0 40 Z" fill="${traits.skinColor}" stroke="#000" stroke-width="4"/>
        <path d="M 300 100 L 320 60 L 300 40 Z" fill="${traits.skinColor}" stroke="#000" stroke-width="4"/>
      </g>
      
      <!-- Title -->
      <text x="400" y="80" text-anchor="middle" class="pixel title">DUNK POGE</text>
      
      <!-- Quantity Display -->
      <rect x="200" y="520" width="400" height="80" fill="#00ff00" stroke="#000" stroke-width="8"/>
      <text x="400" y="565" text-anchor="middle" class="pixel" style="font-size: 32px; fill: #000;">
        MINT ${quantity} NFT${quantity > 1 ? 'S' : ''}
      </text>
      
      <!-- Price Display -->
      <rect x="200" y="610" width="400" height="60" fill="#ffffff" stroke="#000" stroke-width="8"/>
      <text x="400" y="650" text-anchor="middle" class="pixel" style="font-size: 24px; fill: #000;">
        ${(price * quantity).toFixed(4)} ETH
      </text>
      
      <!-- Stats -->
      <text x="400" y="720" text-anchor="middle" class="pixel stats">
        ${remaining} / ${maxSupply} REMAINING
      </text>
      
      <!-- Footer -->
      <text x="400" y="760" text-anchor="middle" class="pixel" style="font-size: 12px; fill: #666;">
        FULLY ON-CHAIN • BASE SEPOLIA
      </text>
    </svg>
  `;
}
