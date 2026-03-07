const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

const allowedOrigins = Array.isArray(config.corsOrigins) && config.corsOrigins.length
	? config.corsOrigins
	: ['*'];

const corsOptions = {
	origin(origin, callback) {
		if (allowedOrigins.includes('*') || !origin) {
			return callback(null, true);
		}

		if (allowedOrigins.includes(origin)) {
			return callback(null, true);
		}

		return callback(new Error('Origin not allowed by CORS'));
	}
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
