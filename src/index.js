// @flow

import http from 'http';
import app from './graphqlServer';

require('dotenv').config();

const port = process.env.PORT || 3000;

http.createServer(app).listen(
  port.toString(),
  () => console.log(`Server is running on port ${port}`), // eslint-disable-line no-console
);
