const Redis = require('ioredis');
const redis = new Redis('redis://default:Quz7IrwBC6WtMOKe3fTvlfL9dPirpn3o@redis-14369.crce288.eu-central-1-1.ec2.cloud.redislabs.com:14369');

async function test() {
  const res = await redis.get('ams_data');
  const data = JSON.parse(res || '{}');
  console.log(`Znalazlem ${data.contacts?.length || 0} kontakty w bazie zdalnej!`);
  if (data.contacts && data.contacts.length > 0) {
    console.log("Kontakty to:", data.contacts.map(c => `${c.first || '???'} ${c.last || '???'}`).join(', '));
  }
  process.exit(0);
}
test();
