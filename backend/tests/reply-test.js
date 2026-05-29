const fetch = require('node-fetch');
(async () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OTVhYTMyMDY1ZDE0NDQ2Y2U2ODEwZSIsImlhdCI6MTc3MTQxNjExNCwiZXhwIjoxNzc0MDA4MTE0fQ.roEazJWd951LCLBp0U15lGyzN8ivO1_e8-RzrNy08_k';
  const replyTo = '6995aa33065d14446ce6811e';
  try {
    const res = await fetch('http://localhost:5000/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ identifier: '1234567891', text: 'this is a reply', replyTo })
    });
    console.log('reply status', res.status, await res.text());
  } catch (e) {
    console.error('error', e);
  }
})();
