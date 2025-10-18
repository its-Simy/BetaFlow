const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('JWT_SECRET:', process.env.JWT_SECRET);

async function testAuth() {
  try {
    // Test bcrypt
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    console.log('✅ Bcrypt hash successful:', hash.substring(0, 20) + '...');
    
    const isValid = await bcrypt.compare(password, hash);
    console.log('✅ Bcrypt compare successful:', isValid);
    
    // Test JWT
    const token = jwt.sign({ userId: 1, email: 'test@example.com' }, process.env.JWT_SECRET);
    console.log('✅ JWT sign successful:', token.substring(0, 20) + '...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ JWT verify successful:', decoded);
    
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
    console.error('Full error:', error);
  }
}

testAuth();
