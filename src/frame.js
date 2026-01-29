// src/frame.js - Clean version
const { Frog, Button } = require('frog');
const { devtools } = require('frog/dev');
const { serveStatic } = require('frog/serve-static');
const { createPublicClient, http, parseEther } = require('viem');
const { baseSepolia } = require('viem/chains');
const { CONFIG, NFT_ABI } = require('./config.js');
const { generateRandomSeed, generateTraits, generateSVG } = require('./nft-generator.js');

// Create Viem client
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(CONFIG.RPC_URL)
});

// Initialize Frog
const app = new Frog({
  title: 'Dunk Poge',
  basePath: '/',
  browserLocation: 'https://dunkpoge.com',
  initialState: {
    seed: generateRandomSeed(),
    quantity: 1
  },
  imageOptions: {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Press Start 2P',
        source: 'google',
        weight: 400
      }
    ]
  }
});

// Main frame route
app.frame('/', async (c) => {
  const { buttonValue, deriveState } = c;
  
  const state = deriveState(previousState => {
    if (buttonValue === 'new') {
      previousState.seed = generateRandomSeed();
    } else if (buttonValue === 'minus' && previousState.quantity > 1) {
      previousState.quantity--;
    } else if (buttonValue === 'plus' && previousState.quantity < 10) {
      previousState.quantity++;
    }
  });

  const seed = state.seed;
  const quantity = state.quantity;

  // Fetch contract data
  let totalSupply = BigInt(0);
  let saleActive = false;
  
  try {
    [totalSupply, saleActive] = await Promise.all([
      publicClient.readContract({
        address: CONFIG.ADDRESSES.NFT,
        abi: NFT_ABI,
        functionName: 'totalSupply'
      }),
      publicClient.readContract({
        address: CONFIG.ADDRESSES.NFT,
        abi: NFT_ABI,
        functionName: 'saleActive'
      })
    ]);
  } catch (error) {
    console.error('Error fetching contract data:', error);
  }

  const remaining = CONFIG.MAX_SUPPLY - Number(totalSupply);
  const traits = generateTraits(seed);
  
  // Generate SVG string from your existing function
  const svgString = generateSVG(traits, quantity, remaining, CONFIG.PRICE, CONFIG.MAX_SUPPLY);
  const svgBase64 = Buffer.from(svgString).toString('base64');

  return c.res({
    image: `data:image/svg+xml;base64,${svgBase64}`,
    intents: [
      <Button value="new">🎲 New</Button>,
      quantity > 1 && <Button value="minus">➖</Button>,
      quantity < 10 && <Button value="plus">➕</Button>,
      saleActive ? (
        <Button.Transaction target="/mint">💎 Mint {quantity}</Button.Transaction>
      ) : (
        <Button.Link href="https://dunkpoge.com">🌐 Website</Button.Link>
      )
    ].filter(Boolean)
  });
});

// Transaction route
app.transaction('/mint', async (c) => {
  const { previousState } = c;
  const quantity = previousState.quantity || 1;
  
  const value = parseEther((CONFIG.PRICE * quantity).toString());
  
  return c.contract({
    abi: NFT_ABI,
    chainId: `eip155:${CONFIG.CHAIN_ID}`,
    functionName: 'mint',
    args: [BigInt(quantity)],
    to: CONFIG.ADDRESSES.NFT,
    value
  });
});

// Success frame - ALSO NEEDS SVG STRING
app.frame('/success', async (c) => {
  const { transactionId } = c;
  
  // Create success SVG
  const successSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel { font-family: 'Press Start 2P', monospace; }
      </style>
      <rect width="800" height="800" fill="#00ff00"/>
      <text x="400" y="200" text-anchor="middle" class="pixel" style="font-size: 64px;">✅</text>
      <text x="400" y="300" text-anchor="middle" class="pixel" style="font-size: 36px;">MINT SUCCESS!</text>
      <text x="400" y="400" text-anchor="middle" class="pixel" style="font-size: 20px;">
        TX: ${transactionId?.slice(0, 10)}...
      </text>
      <text x="400" y="500" text-anchor="middle" class="pixel" style="font-size: 16px;">
        SUCH DUNK • VERY POGE • WOW
      </text>
    </svg>
  `;
  
  const successBase64 = Buffer.from(successSVG).toString('base64');

  return c.res({
    image: `data:image/svg+xml;base64,${successBase64}`,
    intents: [
      <Button.Reset>🔄 New Mint</Button.Reset>,
      <Button.Link href={`${CONFIG.CHAIN_INFO.explorer}/tx/${transactionId}`}>
        🔍 View Transaction
      </Button.Link>,
      <Button.Link href="https://dunkpoge.com">
        🌐 Official Site
      </Button.Link>
    ]
  });
});

// Health check - ALSO NEEDS SVG STRING
app.frame('/health', (c) => {
  const healthSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel { font-family: 'Press Start 2P', monospace; }
      </style>
      <rect width="800" height="800" fill="#000000"/>
      <text x="400" y="300" text-anchor="middle" class="pixel" style="font-size: 48px; fill: white;">DUNK POGE</text>
      <text x="400" y="400" text-anchor="middle" class="pixel" style="font-size: 32px; fill: #00ff00;">
        ▶ FRAME ONLINE
      </text>
    </svg>
  `;
  
  const healthBase64 = Buffer.from(healthSVG).toString('base64');

  return c.res({
    image: `data:image/svg+xml;base64,${healthBase64}`,
    intents: [
      <Button.Link href="https://dunkpoge.com">Official Site</Button.Link>
    ]
  });
});

// Export for Netlify Functions
module.exports.GET = app.fetch;
module.exports.POST = app.fetch;

// Local dev server
if (require.main === module) {
  const { serve } = require('@hono/node-server');
  serve({
    fetch: app.fetch,
    port: 3000
  });
  console.log('🚀 Frame running at http://localhost:3000');
}