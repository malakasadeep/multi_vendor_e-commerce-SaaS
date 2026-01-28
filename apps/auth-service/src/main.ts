import { errorMiddleware } from '../../../packages/error-handler/error-middleware';
import express from 'express';
import * as path from 'path';
import  cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors(
  {
    origin: 'http://localhost:3000',
    allowedHeaders:["Authorization", "Content-Type"],
    credentials: true,
  }
));

app.use(express.json());
app.use(cookieParser())

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
  res.send({ message: 'Welcome to auth-service!' });
});

app.use(errorMiddleware)

const port = process.env.PORT || 6001;

const server = app.listen(port, () => {
  console.log(`Auth service listening at http://localhost:${port}/api`);
});
server.on('error', (err) => {
  console.log("Server error: ", err);
});
