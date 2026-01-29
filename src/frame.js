// src/frame.js - Main Frog App (CommonJS for Netlify)
const { Frog, Button } = require('frog');
const { devtools } = require('frog/dev');
const { serveStatic } = require('frog/serve-static');
const { createPublicClient, http, parseEther } = require('viem');
const { baseSepolia } = require('viem/chains');
const { CONFIG, NFT_ABI } = require('./config.js');
const { generateRandomSeed, generateTraits } = require('./nft-generator.js');

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
  const totalPrice = (CONFIG.PRICE * quantity).toFixed(4);

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
          color: 'white',
          fontFamily: 'Press Start 2P',
          padding: '40px'
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 48,
            marginBottom: 30,
            color: '#fff',
            textAlign: 'center'
          }}
        >
          DUNK POGE NFT
        </div>

        {/* NFT Preview */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 40,
            marginBottom: 30
          }}
        >
          {/* Face */}
          <div
            style={{
              width: 200,
              height: 200,
              backgroundColor: traits.skinColor,
              border: '8px solid #000',
              position: 'relative',
              borderRadius: '10px'
            }}
          >
            {/* Hair */}
            {traits.hasHair && (
              <div
                style={{
                  position: 'absolute',
                  top: -20,
                  left: 0,
                  width: '100%',
                  height: 30,
                  backgroundColor: traits.hairColor,
                  border: '8px solid #000',
                  borderBottom: 'none',
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px'
                }}
              />
            )}

            {/* Eyes */}
            <div
              style={{
                position: 'absolute',
                top: 60,
                left: 30,
                width: 40,
                height: 30,
                backgroundColor: traits.eyeColor,
                border: '4px solid #000',
                borderRadius: '5px'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 60,
                right: 30,
                width: 40,
                height: 30,
                backgroundColor: traits.eyeColor,
                border: '4px solid #000',
                borderRadius: '5px'
              }}
            />

            {/* Mouth */}
            <div
              style={{
                position: 'absolute',
                bottom: 50,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 80,
                height: 15,
                backgroundColor: traits.lipColor,
                border: '4px solid #000',
                borderRadius: '5px'
              }}
            />
          </div>

          {/* Info Panel */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 15,
              fontSize: 16
            }}
          >
            <div style={{ color: '#0f0' }}>┌─ TRAITS ─┐</div>
            <div>Seed: #{seed}</div>
            <div>Skin: ███</div>
            <div>Eyes: ███</div>
            <div>Hair: {traits.hasHair ? 'YES' : 'NO'}</div>
            <div style={{ color: '#0f0' }}>└──────────┘</div>
          </div>
        </div>

        {/* Quantity & Price */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            marginBottom: 30
          }}
        >
          <div
            style={{
              fontSize: 32,
              backgroundColor: '#0f0',
              color: '#000',
              padding: '15px 40px',
              border: '8px solid #000',
              borderRadius: '10px'
            }}
          >
            MINT ×{quantity}
          </div>

          <div
            style={{
              fontSize: 24,
              backgroundColor: '#fff',
              color: '#000',
              padding: '10px 30px',
              border: '6px solid #000',
              borderRadius: '8px'
            }}
          >
            {totalPrice} ETH
          </div>
        </div>

        {/* Supply */}
        <div
          style={{
            fontSize: 18,
            marginBottom: 10,
            color: '#0ff'
          }}
        >
          {remaining} / {CONFIG.MAX_SUPPLY} REMAINING
        </div>

        {/* Footer */}
        <div
          style={{
            fontSize: 12,
            color: '#666',
            marginTop: 10
          }}
        >
          BASE SEPOLIA • ON-CHAIN
        </div>
      </div>
    ),
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