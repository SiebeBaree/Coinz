import process from 'node:process';
import { connect } from 'mongoose';

connect(process.env.DATABASE_URI!)
    .then(() => console.log('Connected to MongoDB'))
    .catch(console.error);
