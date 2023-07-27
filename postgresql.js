import pg from 'pg';

const pool = new pg.Pool({
  user: process.env.USERNAME,
  host: process.env.HOST,
  database: process.env.DATABASENAME,
  password: process.env.PASSWORD,
  port: 5432,
});

pool.connect((err, client, done) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
      console.log('Connected to the database');
  }
  done();
});

// Make the pool available to other parts of the application
export { pool }


