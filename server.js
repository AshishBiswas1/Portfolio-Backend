const mongoose = require('mongoose');
const dotenv = require('dotenv');
const backfillProjectEmbeddings = require('./util/backfillEmbeddings');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

const clientOptions = {
  serverApi: { version: '1', strict: true, deprecationErrors: true }
};

async function connectDB() {
  try {
    const conn = await mongoose.connect(DB, clientOptions);
    console.log(`DB connection successful! Connected to [Host: ${conn.connection.host}, Database: ${conn.connection.name}]`);
    
    // Auto-backfill 384-dim PyTorch vector embeddings for existing projects
    backfillProjectEmbeddings();
  } catch (err) {
    console.log('DB connection error:', err);
    process.exit(1);
  }
}
connectDB();

const app = require('./app');

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`Portfolio Backend Gateway running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
