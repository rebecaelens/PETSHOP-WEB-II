const app = require('./app');
const config = require('./config');
const { migrate } = require('./db/migrate');
const { seed } = require('./db/seed');

async function start() {
  await migrate();
  await seed();

  app.listen(config.port, () => {
    console.log(`API running on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
