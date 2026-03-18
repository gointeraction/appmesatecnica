async function testLogin() {
  const email = 'admin@cavecom-e.org';
  const password = 'admin123';
  
  console.log(`Testing login for ${email}...`);
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.headers.get('set-cookie')) {
      console.log('Cookies received:', response.headers.get('set-cookie'));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();
