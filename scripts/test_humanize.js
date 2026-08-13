(async ()=>{
  try {
    const res = await fetch('http://localhost:3000/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: "Hello world test - remove fluff: In today's fast-paced digital world, we can supercharge growth.", tone: 'casual' })
    });
    const t = await res.text();
    console.log('STATUS', res.status);
    console.log('BODY', t);
  } catch (e) {
    console.error('ERR', e);
    process.exit(1);
  }
})();
