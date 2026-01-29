// src/frame.js - Updated with string images
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
// src/frame.js - Updated with string images
const { Frog, Button } = require('frog');
const { devtools } = require('frog/dev');
const { serveStatic } = require('frog/serve-static');
const { createPublicClient, http, parseEther } = require('viem');
const { baseSepolia } = require('viem/chains');
const { CONFIG, NFT_ABI } = require('./config.js');
const { generateRandomSeed, generateTraits, generateSVG } = require('./nft-generator.js');

// ... rest of the imports and setup ...

// Main frame route - UPDATED
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

// Success frame
app.frame('/success', async (c) => {
  const { transactionId } = c;
  
  return c.res({
    image: (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#0f0',
          color: '#000',
          fontFamily: 'Press Start 2P',
          padding: '40px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 20 }}>✅</div>
        <div style={{ fontSize: 40, marginBottom: 10 }}>MINT SUCCESS!</div>
        <div style={{ fontSize: 20, marginBottom: 20, opacity: 0.8 }}>
          TX: {transactionId?.slice(0, 12)}...
        </div>
        <div style={{ fontSize: 16, marginBottom: 30 }}>
          SUCH DUNK • VERY POGE • WOW
        </div>
        <div style={{ fontSize: 14, opacity: 0.6 }}>
          View on {CONFIG.CHAIN_INFO.name}
        </div>
      </div>
    ),
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

// Health check
app.frame('/health', (c) => {
  return c.res({
    image: (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          color: '#fff',
          fontFamily: 'Press Start 2P',
          fontSize: 48
        }}
      >
        <div>DUNK POGE</div>
        <div style={{ fontSize: 32, color: '#0f0', marginTop: 20 }}>
          ▶ FRAME ONLINE
        </div>
      </div>
    ),
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