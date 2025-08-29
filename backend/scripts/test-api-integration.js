const axios = require('axios');

const baseURL = 'http://localhost:5000/api';

async function testAPIs() {
    console.log('🧪 Testing Game API Integration\n');

    try {
        // 1. Test user login
        console.log('1. Testing User Login...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            identifier: 'apitestuser',
            password: 'testpass123'
        });

        if (loginResponse.data.success) {
            console.log('✅ Login successful');
            const token = loginResponse.data.token;
            const user = loginResponse.data.user;
            console.log(`   User: ${user.username}, Balance: ${user.walletBalance}`);

            // 2. Test game numbers endpoint
            console.log('\n2. Testing Game Numbers...');
            const numbersResponse = await axios.get(`${baseURL}/game/numbers`);
            if (numbersResponse.data.success) {
                console.log('✅ Game numbers fetched successfully');
                console.log(`   Class A: ${numbersResponse.data.data.A.length} numbers`);
                console.log(`   Class B: ${numbersResponse.data.data.B.length} numbers`);
                console.log(`   Class C: ${numbersResponse.data.data.C.length} numbers`);
                console.log(`   Class D: ${numbersResponse.data.data.D.length} numbers`);
            }

            // 3. Test specific class numbers
            console.log('\n3. Testing Class D Numbers...');
            const classDResponse = await axios.get(`${baseURL}/game/numbers/D`);
            if (classDResponse.data.success) {
                console.log('✅ Class D numbers fetched successfully');
                console.log(`   Numbers: [${classDResponse.data.data.numbers.join(', ')}]`);
            }

            // 4. Test current round
            console.log('\n4. Testing Current Round...');
            const roundResponse = await axios.get(`${baseURL}/game/current-round`);
            if (roundResponse.data.success) {
                console.log('✅ Current round fetched successfully');
                console.log(`   Round ID: ${roundResponse.data.data._id}`);
                console.log(`   Status: ${roundResponse.data.data.status}`);
            }

            // 5. Test place bet
            console.log('\n5. Testing Place Bet...');
            const betResponse = await axios.post(`${baseURL}/game/bet`, {
                gameClass: 'D',
                selectedNumber: '7',
                betAmount: 50,
                timeSlot: new Date().toISOString()
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (betResponse.data.success) {
                console.log('✅ Bet placed successfully');
                console.log(`   Bet ID: ${betResponse.data.data.bet._id}`);
                console.log(`   New Balance: ${betResponse.data.data.newWalletBalance}`);
            }

            // 6. Test user bets
            console.log('\n6. Testing User Bets...');
            const userBetsResponse = await axios.get(`${baseURL}/game/bets`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (userBetsResponse.data.success) {
                console.log('✅ User bets fetched successfully');
                console.log(`   Total bets: ${userBetsResponse.data.data.bets.length}`);
                if (userBetsResponse.data.data.bets.length > 0) {
                    const bet = userBetsResponse.data.data.bets[0];
                    console.log(`   Latest bet: ${bet.gameClass}-${bet.selectedNumber}, Amount: ${bet.betAmount}, Status: ${bet.status}`);
                }
            }

            // 7. Test wallet balance
            console.log('\n7. Testing Wallet Balance...');
            const balanceResponse = await axios.get(`${baseURL}/wallet/balance`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (balanceResponse.data.success) {
                console.log('✅ Wallet balance fetched successfully');
                console.log(`   Balance: ${balanceResponse.data.data.balance}`);
            }

            console.log('\n🎉 All API tests completed successfully!');

        } else {
            console.log('❌ Login failed:', loginResponse.data.message);
        }

    } catch (error) {
        console.error('❌ API Test Error:', error.response ? .data || error.message);
    }
}

testAPIs();